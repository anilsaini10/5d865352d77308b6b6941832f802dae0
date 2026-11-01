import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Layers } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { AsyncContent, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, SearchInput, Table, Tabs, THead, Th, Tr, Td, selectClass } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorCode } from '../../../api/httpClient.js'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { schoolsApi } from '../../schools/schools.api.js'
import { plansApi } from '../subscription.api.js'
import { describeError } from '../subscription.errors.js'
import { PLAN_TYPES, ROLE_OPTIONS, SCOPES, planTypeLabel, priceRange, scopeLabel } from '../subscription.constants.js'
import PlanFormModal from './PlanFormModal.jsx'
import ActiveSwitch from './ActiveSwitch.jsx'
import { RoleChips, TrialBadge } from './PlanBadges.jsx'

const ALL = 'ALL'

export default function PlansPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const [role, setRole] = useState(ALL)
  const [scope, setScope] = useState('')
  const [planType, setPlanType] = useState('')
  const [isActive, setIsActive] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search.trim(), 300)
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [toDeactivate, setToDeactivate] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const { data: schoolsData } = useFetch(() => schoolsApi.list({ page: 1, pageSize: 100 }), [], { errorMessage: 'Could not load schools.' })
  const schools = schoolsData?.items ?? []

  // Fetch all roles once and tab client-side, so the tab counts stay stable.
  const { data, setData, loading, error, reload } = useFetch(
    () => plansApi.list({ scope, planType, isActive, schoolId, search: debounced }),
    [scope, planType, isActive, schoolId, debounced],
    { errorMessage: 'Could not load plans.' }
  )
  useEffect(() => { document.title = 'Plans' }, [])
  const all = data ?? []
  const items = role === ALL ? all : all.filter((p) => p.targetRoles?.includes(role))
  const tabs = [{ value: ALL, label: 'All', count: all.length }, ...ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label, count: all.filter((p) => p.targetRoles?.includes(r.value)).length }))]
  const hasFilters = !!(scope || planType || isActive || schoolId || debounced)

  const patchRow = (updated) => setData((d) => d && d.map((p) => (p.id === updated.id ? updated : p)))

  const toggleActive = async (p) => {
    setTogglingId(p.id)
    try {
      patchRow(await plansApi.update(p.id, { isActive: !p.isActive }))
    } catch (err) {
      notify(describeError(err, 'Could not update the plan.'), 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const remove = async () => {
    const p = toDelete
    try {
      await plansApi.remove(p.id)
      notify('Plan deleted.', 'success')
      reload()
    } catch (err) {
      if (getErrorCode(err) === 'PLAN_IN_USE') setToDeactivate(p)
      else notify(describeError(err, 'Could not delete the plan.'), 'error')
    }
  }
  const deactivate = async () => {
    try {
      patchRow(await plansApi.update(toDeactivate.id, { isActive: false }))
      notify('Plan deactivated.', 'success')
    } catch (err) {
      notify(describeError(err, 'Could not deactivate the plan.'), 'error')
    }
  }

  return (
    <AppShell title="Plans" subtitle="What users and schools can buy" actions={<Button icon={Plus} onClick={() => setFormOpen(true)}>Add plan</Button>}>
      <div className="overflow-x-auto mb-4"><Tabs options={tabs} value={role} onChange={setRole} /></div>

      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by code or name…" className="lg:max-w-xs" />
        <select className={`${selectClass} lg:w-36`} value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Filter by scope">
          <option value="">All scopes</option>
          {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className={`${selectClass} lg:w-36`} value={planType} onChange={(e) => setPlanType(e.target.value)} aria-label="Filter by plan type">
          <option value="">All types</option>
          {PLAN_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className={`${selectClass} lg:w-48`} value={schoolId} onChange={(e) => setSchoolId(e.target.value)} aria-label="Filter by school">
          <option value="">Any school</option>
          <option value="global">All-schools plans only</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
            <EmptyState icon={Layers} title={hasFilters || role !== ALL ? 'No matching plans' : 'No plans yet'} message={hasFilters || role !== ALL ? 'Try clearing a filter.' : 'Create your first plan.'}
              action={!hasFilters && role === ALL && <Button icon={Plus} onClick={() => setFormOpen(true)}>Add plan</Button>} />
          }
        >
          <Table className={loading ? 'opacity-60' : ''}>
            <THead><Th>Code</Th><Th>Name</Th><Th>Scope</Th><Th>Type</Th><Th>Roles</Th><Th>Trial</Th><Th>School</Th><Th>Price</Th><Th>Subscribers</Th><Th>Active</Th><Th /></THead>
            <tbody>
              {items.map((p) => (
                <Tr key={p.id} className="cursor-pointer hover:bg-line/20" onClick={() => navigate(`/plans/${p.id}`)}>
                  <Td className="font-mono text-xs text-ink">{p.code}</Td>
                  <Td className="font-semibold text-ink min-w-[140px]">{p.name}</Td>
                  <Td><Badge tone={p.scope === 'SCHOOL' ? 'info' : 'neutral'}>{scopeLabel(p.scope)}</Badge></Td>
                  <Td>{planTypeLabel(p.planType)}</Td>
                  <Td><RoleChips roles={p.targetRoles} /></Td>
                  <Td>{p.trial ? <TrialBadge trial={p.trial} /> : <span className="text-ink/35">—</span>}</Td>
                  <Td className="whitespace-nowrap">{p.school?.name ?? <span className="text-ink/45">All schools</span>}</Td>
                  <Td className="whitespace-nowrap">{priceRange(p.prices)}</Td>
                  <Td className="whitespace-nowrap">{p.liveSubscriptions} live / {p.totalSubscriptions}</Td>
                  <Td onClick={(e) => e.stopPropagation()}><ActiveSwitch checked={p.isActive} busy={togglingId === p.id} label={p.name} onToggle={() => toggleActive(p)} /></Td>
                  <Td onClick={(e) => e.stopPropagation()}><IconButton icon={Trash2} label="Delete plan" tone="danger" onClick={() => setToDelete(p)} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      <PlanFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={(plan) => navigate(`/plans/${plan.id}`)} />
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={remove} title="Delete plan?"
        message={<>Delete <strong>{toDelete?.name}</strong> ({toDelete?.code})? This only works if nobody has subscribed to it.</>} />
      <ConfirmDialog open={!!toDeactivate} onClose={() => setToDeactivate(null)} onConfirm={deactivate} title="Plan has subscriptions" confirmLabel="Deactivate" danger={false}
        message={<><strong>{toDeactivate?.name}</strong> already has subscriptions, so it can't be deleted. Deactivate it instead? Existing subscribers keep their access.</>} />
    </AppShell>
  )
}
