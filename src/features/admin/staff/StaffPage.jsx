import { useState } from 'react'
import { Plus, BriefcaseBusiness, Pencil, Trash2, UserX, UserCheck } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import {
  AsyncContent,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  CredentialsBanner,
  EmptyState,
  IconButton,
  RECORD_STATUS,
  SearchInput,
  StatusFilter,
  Table,
  THead,
  Th,
  Tr,
  Td,
  selectClass,
} from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { experienceLabel, formatCurrency, formatDate } from '../../../utils/format.js'
import { staffApi } from './staff.api.js'
import { roleAccountsApi } from '../roleAccounts/roleAccounts.api.js'
import StaffFormModal from './components/StaffFormModal.jsx'
import StaffDeleteDialog from './components/StaffDeleteDialog.jsx'

function LoginBadge({ member }) {
  if (!member.userId) return <Badge tone="neutral">No Account</Badge>
  if (member.isActive) return <Badge tone="active">Active</Badge>
  return <Badge tone="danger">Disabled</Badge>
}

const PAGE_SIZE = 15

export default function StaffPage() {
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [status, setStatus] = useState(RECORD_STATUS.ALL)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  const { data: rolesData } = useFetch(() => roleAccountsApi.listRoles(), [], { errorMessage: 'Could not load roles.' })
  const roles = Array.isArray(rolesData) ? rolesData : rolesData?.items ?? []

  const [formModal, setFormModal] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [justCreated, setJustCreated] = useState(null)

  const { data, loading, error, reload } = useFetch(
    () =>
      staffApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        customRoleId: roleFilter || undefined,
        status: status === RECORD_STATUS.ALL ? undefined : status,
      }),
    [page, debouncedSearch, roleFilter, status],
    { errorMessage: 'Could not load staff.' }
  )

  const staff = data?.items ?? []
  const hasFilters = !!(debouncedSearch || roleFilter)

  const withPageReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const handleSaved = (result, { isEdit }) => {
    if (isEdit) {
      notify(`${result?.name ?? 'Staff member'} was updated.`, 'success')
    } else {
      setJustCreated(result)
    }
    reload()
  }

  const setActive = async (member, active) => {
    try {
      await staffApi.update(member.id, { status: active ? 'ACTIVE' : 'INACTIVE' })
      notify(`${member.name} was ${active ? 'activated' : 'deactivated'}.`, 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, `Could not ${active ? 'activate' : 'deactivate'} staff member.`), 'error')
    }
  }

  const deletePermanently = async (member) => {
    try {
      await staffApi.remove(member.id)
      notify(`${member.name} was permanently deleted.`, 'success')
      if (staff.length === 1 && page > 1) setPage(page - 1)
      else reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete staff member.'), 'error')
    }
  }

  const emptyState = hasFilters ? (
    <EmptyState icon={BriefcaseBusiness} title="No matches" message="Try a different search term or role." />
  ) : status === RECORD_STATUS.INACTIVE ? (
    <EmptyState icon={BriefcaseBusiness} title="No inactive staff" message="Staff you deactivate show up here." />
  ) : (
    <EmptyState
      icon={BriefcaseBusiness}
      title="No staff yet"
      message="Add non-teaching staff such as accountants, drivers or librarians."
      action={<Button icon={Plus} onClick={() => setFormModal({})}>Add staff member</Button>}
    />
  )

  return (
    <AppShell
      title="Staff"
      subtitle="Non-teaching staff records"
      actions={<Button icon={Plus} onClick={() => setFormModal({})}>Add staff</Button>}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={withPageReset(setSearch)} placeholder="Search by name, employee ID or phone..." />
        <select
          className={`${selectClass} sm:w-56`}
          value={roleFilter}
          onChange={(e) => withPageReset(setRoleFilter)(e.target.value)}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-5 overflow-x-auto">
        <StatusFilter value={status} onChange={withPageReset(setStatus)} inactiveLabel="Inactive" />
      </div>

      {justCreated && (
        <CredentialsBanner
          title={`${justCreated.staff?.name ?? 'Staff member'} added`}
          description="Share this password with the staff member. They can change it after first login."
          loginId={justCreated.staff?.email}
          password={justCreated.defaultPassword}
          onDismiss={() => setJustCreated(null)}
        />
      )}

      <Card className="overflow-hidden">
        <AsyncContent loading={loading} error={error} empty={staff.length === 0} emptyState={emptyState}>
          <Table>
            <THead>
              <Th>Staff member</Th>
              <Th>Role</Th>
              <Th>Phone</Th>
              <Th>Experience</Th>
              <Th>Salary</Th>
              <Th>Joined</Th>
              <Th>Login</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {staff.map((m) => {
                const active = m.status !== 'INACTIVE'
                return (
                  <Tr key={m.id} className="hover:bg-line/20">
                    <Td>
                      <span className="block font-semibold text-ink">{m.name}</span>
                      <span className="block text-xs text-ink/50">
                        {m.employeeId}
                        {m.email ? ` · ${m.email}` : ''}
                      </span>
                    </Td>
                    <Td>
                      <span className="block text-ink/80">{m.customRole?.name || m.designation}</span>
                      <span className="block text-xs text-ink/50">{m.qualification}</span>
                    </Td>
                    <Td className="whitespace-nowrap">{m.phone}</Td>
                    <Td className="whitespace-nowrap">{experienceLabel(m.experienceYears, m.experienceMonths)}</Td>
                    <Td className="whitespace-nowrap">{formatCurrency(m.salary)}</Td>
                    <Td className="whitespace-nowrap">{formatDate(m.joiningDate)}</Td>
                    <Td><LoginBadge member={m} /></Td>
                    <Td>
                      <Badge tone={active ? 'active' : 'inactive'}>{active ? 'Active' : 'Inactive'}</Badge>
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <IconButton icon={Pencil} label={`Edit ${m.name}`} tone="primary" onClick={() => setFormModal({ staff: m })} />
                        {active ? (
                          <IconButton icon={UserX} label={`Deactivate ${m.name}`} onClick={() => setDeactivateTarget(m)} />
                        ) : (
                          <IconButton icon={UserCheck} label={`Activate ${m.name}`} tone="primary" onClick={() => setActive(m, true)} />
                        )}
                        <IconButton icon={Trash2} label={`Permanently delete ${m.name}`} tone="danger" onClick={() => setDeleteTarget(m)} />
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {!loading && !error && staff.length > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}

      <StaffFormModal open={!!formModal} onClose={() => setFormModal(null)} staff={formModal?.staff} onSaved={handleSaved} />

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => setActive(deactivateTarget, false)}
        title="Deactivate this staff member?"
        message={`${deactivateTarget?.name} will be marked inactive. Their record is kept and you can activate them again any time.`}
        confirmLabel="Deactivate"
        danger={false}
      />

      <StaffDeleteDialog
        staff={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={deletePermanently}
        onDeactivate={(m) => setActive(m, false)}
      />
    </AppShell>
  )
}
