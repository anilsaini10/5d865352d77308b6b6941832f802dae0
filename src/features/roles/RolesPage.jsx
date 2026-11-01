import { useState } from 'react'
import { Plus, ShieldCheck, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  AsyncContent,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  SearchInput,
  Tabs,
  Table,
  THead,
  Th,
  Tr,
  Td,
} from '../../components/ui.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { useToast } from '../../context/ToastContext.jsx'
import { getErrorMessage } from '../../api/httpClient.js'
import { rolesApi } from './roles.api.js'
import RoleFormModal from './components/RoleFormModal.jsx'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export default function RolesPage() {
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const debouncedSearch = useDebouncedValue(search.trim(), 400)

  const [formModal, setFormModal] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, loading, error, reload } = useFetch(
    () => rolesApi.list({ status: status === 'ALL' ? undefined : status, search: debouncedSearch }),
    [status, debouncedSearch],
    { errorMessage: 'Could not load roles.' }
  )

  const roles = data?.items ?? []

  const handleSaved = (saved, { isEdit, reactivated }) => {
    if (reactivated) notify(`${saved?.name ?? 'Role'} was reactivated.`, 'success')
    else notify(isEdit ? `${saved?.name ?? 'Role'} was updated.` : `${saved?.name ?? 'Role'} was created.`, 'success')
    reload()
  }

  const toggleActive = async (role, active) => {
    try {
      await rolesApi.update(role.id, { isActive: active })
      notify(`${role.name} was ${active ? 'activated' : 'deactivated'}.`, 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, `Could not ${active ? 'activate' : 'deactivate'} role.`), 'error')
    }
  }

  const handleDelete = async (role) => {
    try {
      await rolesApi.remove(role.id)
      notify(`${role.name} was deleted.`, 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    }
  }

  const emptyState = debouncedSearch ? (
    <EmptyState icon={ShieldCheck} title="No matches" message="Try a different search term." />
  ) : status !== 'ALL' ? (
    <EmptyState icon={ShieldCheck} title={`No ${status.toLowerCase()} roles`} message={status === 'INACTIVE' ? 'Roles you deactivate show up here.' : 'All roles are currently inactive.'} />
  ) : (
    <EmptyState
      icon={ShieldCheck}
      title="No roles yet"
      message="Create custom roles like Accountant or Librarian for school staff."
      action={<Button icon={Plus} onClick={() => setFormModal({})}>Create role</Button>}
    />
  )

  return (
    <AppShell
      title="Roles"
      subtitle="Custom roles for school staff accounts"
      actions={<Button icon={Plus} onClick={() => setFormModal({})}>Create role</Button>}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search roles..." />
      </div>

      <div className="mb-5 overflow-x-auto">
        <Tabs options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </div>

      <Card className="overflow-hidden">
        <AsyncContent loading={loading} error={error} empty={roles.length === 0} emptyState={emptyState}>
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Key</Th>
              <Th>Description</Th>
              <Th>Accounts</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {roles.map((r) => (
                <Tr key={r.id} className="hover:bg-line/20">
                  <Td>
                    <span className="font-semibold text-ink">{r.name}</span>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-ink/50">{r.key}</span>
                  </Td>
                  <Td>
                    <span className="text-ink/60 line-clamp-1">{r.description || '—'}</span>
                  </Td>
                  <Td className="whitespace-nowrap">{r.usersCount}</Td>
                  <Td>
                    <Badge tone={r.isActive ? 'active' : 'inactive'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <IconButton icon={Pencil} label={`Edit ${r.name}`} tone="primary" onClick={() => setFormModal({ role: r })} />
                      {r.isActive ? (
                        <IconButton icon={ToggleLeft} label={`Deactivate ${r.name}`} onClick={() => setDeactivateTarget(r)} />
                      ) : (
                        <IconButton icon={ToggleRight} label={`Activate ${r.name}`} tone="primary" onClick={() => toggleActive(r, true)} />
                      )}
                      {r.usersCount === 0 ? (
                        <IconButton icon={Trash2} label={`Delete ${r.name}`} tone="danger" onClick={() => setDeleteTarget(r)} />
                      ) : (
                        <span title="Deactivate instead, accounts use this role">
                          <IconButton icon={Trash2} label="Delete" tone="danger" disabled className="opacity-30 cursor-not-allowed" />
                        </span>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      <RoleFormModal open={!!formModal} onClose={() => setFormModal(null)} role={formModal?.role} onSaved={handleSaved} />

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => toggleActive(deactivateTarget, false)}
        title={`Deactivate ${deactivateTarget?.name}?`}
        message={`It will be hidden from school admins and its ${deactivateTarget?.usersCount ?? 0} account(s) won't be able to log in.`}
        confirmLabel="Deactivate"
        danger
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget)}
        title={`Delete ${deleteTarget?.name}?`}
        message="This role will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </AppShell>
  )
}
