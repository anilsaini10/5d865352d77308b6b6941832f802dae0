import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Puzzle } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { AsyncContent, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, SearchInput, Table, THead, Th, Tr, Td, selectClass } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorCode } from '../../../api/httpClient.js'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { featuresApi } from '../subscription.api.js'
import { describeError } from '../subscription.errors.js'
import { ROLE_OPTIONS, roleLabel } from '../subscription.constants.js'
import FeatureFormModal from './FeatureFormModal.jsx'
import ActiveSwitch from '../plans/ActiveSwitch.jsx'

export default function FeaturesPage() {
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search.trim(), 300)
  const [role, setRole] = useState('')
  const [isPaid, setIsPaid] = useState('')
  const [isActive, setIsActive] = useState('')
  const [form, setForm] = useState({ open: false, feature: null })
  const [toDelete, setToDelete] = useState(null)
  const [toDeactivate, setToDeactivate] = useState(null) // offered when delete fails with FEATURE_IN_USE
  const [togglingId, setTogglingId] = useState(null)

  const { data, setData, loading, error, reload } = useFetch(
    () => featuresApi.list({ role, isPaid, isActive, search: debounced }),
    [role, isPaid, isActive, debounced],
    { errorMessage: 'Could not load features.' }
  )
  const items = data ?? []
  const hasFilters = !!(role || isPaid || isActive || debounced)

  useEffect(() => { document.title = 'Features' }, [])

  const patchRow = (updated) => setData((d) => d && d.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)))

  const toggleActive = async (f) => {
    setTogglingId(f.id)
    try {
      patchRow(await featuresApi.update(f.id, { isActive: !f.isActive }))
    } catch (err) {
      notify(describeError(err, 'Could not update the feature.'), 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const remove = async () => {
    const f = toDelete
    try {
      await featuresApi.remove(f.id)
      notify('Feature deleted.', 'success')
      reload()
    } catch (err) {
      if (getErrorCode(err) === 'FEATURE_IN_USE') setToDeactivate(f)
      else notify(describeError(err, 'Could not delete the feature.'), 'error')
    }
  }

  const deactivate = async () => {
    try {
      patchRow(await featuresApi.update(toDeactivate.id, { isActive: false }))
      notify('Feature deactivated.', 'success')
    } catch (err) {
      notify(describeError(err, 'Could not deactivate the feature.'), 'error')
    }
  }

  return (
    <AppShell
      title="Features"
      subtitle="Lockable parts of the app — plans unlock them"
      actions={<Button icon={Plus} onClick={() => setForm({ open: true, feature: null })}>Add feature</Button>}
    >
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by key or name…" className="lg:max-w-xs" />
        <select className={`${selectClass} lg:w-40`} value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select className={`${selectClass} lg:w-40`} value={isPaid} onChange={(e) => setIsPaid(e.target.value)} aria-label="Filter by free or paid">
          <option value="">Free & paid</option>
          <option value="true">Paid</option>
          <option value="false">Free</option>
        </select>
        <select className={`${selectClass} lg:w-40`} value={isActive} onChange={(e) => setIsActive(e.target.value)} aria-label="Filter by active">
          <option value="">Active & inactive</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading && !data}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={Puzzle}
              title={hasFilters ? 'No matching features' : 'No features yet'}
              message={hasFilters ? 'Try clearing a filter.' : 'Create a feature, then attach it to a plan.'}
              action={!hasFilters && <Button icon={Plus} onClick={() => setForm({ open: true, feature: null })}>Add feature</Button>}
            />
          }
        >
          <Table className={loading ? 'opacity-60' : ''}>
            <THead><Th>Key</Th><Th>Name</Th><Th>Roles</Th><Th>Type</Th><Th>Used in</Th><Th>Active</Th><Th /></THead>
            <tbody>
              {items.map((f) => (
                <Tr key={f.id}>
                  <Td className="font-mono text-xs text-ink">{f.key}</Td>
                  <Td className="min-w-[160px]">
                    <p className="font-semibold text-ink">{f.name}</p>
                    {f.description && <p className="text-xs text-ink/50 line-clamp-1">{f.description}</p>}
                  </Td>
                  <Td><div className="flex flex-wrap gap-1">{f.roles.map((r) => <Badge key={r} tone="primary">{roleLabel(r)}</Badge>)}</div></Td>
                  <Td><Badge tone={f.isPaid ? 'amber' : 'success'}>{f.isPaid ? 'Paid' : 'Free'}</Badge></Td>
                  <Td className="whitespace-nowrap">{f.planCount} plan{f.planCount === 1 ? '' : 's'}</Td>
                  <Td>
                    <ActiveSwitch checked={f.isActive} busy={togglingId === f.id} label={f.name} onToggle={() => toggleActive(f)} />
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <IconButton icon={Pencil} label="Edit feature" onClick={() => setForm({ open: true, feature: f })} />
                      <IconButton icon={Trash2} label="Delete feature" tone="danger" onClick={() => setToDelete(f)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      <FeatureFormModal
        open={form.open}
        feature={form.feature}
        onClose={() => setForm({ open: false, feature: null })}
        onSaved={() => reload()}
      />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete feature?"
        message={<>Delete <strong>{toDelete?.name}</strong> ({toDelete?.key})? This only works if no plan uses it.</>}
      />
      <ConfirmDialog
        open={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        onConfirm={deactivate}
        title="Feature is in use"
        message={<><strong>{toDeactivate?.name}</strong> is used in one or more plans, so it can't be deleted. Deactivate it instead?</>}
        confirmLabel="Deactivate"
        danger={false}
      />
    </AppShell>
  )
}
