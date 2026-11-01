import { useState } from 'react'
import { Plus, UserPlus, Pencil, ToggleLeft, ToggleRight, KeyRound } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import ResetPasswordDialog from '../../../components/ResetPasswordDialog.jsx'
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
} from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { roleAccountsApi } from './roleAccounts.api.js'
import { usersApi } from '../users/users.api.js'
import AccountFormModal from './components/AccountFormModal.jsx'
import CredentialsDialog from './components/CredentialsDialog.jsx'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export default function RoleAccountsPage() {
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim(), 400)

  const [formModal, setFormModal] = useState(null)
  const [credentials, setCredentials] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)

  const { data: rolesData, reload: reloadRoles } = useFetch(
    () => roleAccountsApi.listRoles(),
    [],
    { errorMessage: 'Could not load roles.' }
  )
  const availableRoles = rolesData?.items ?? []

  const { data, loading, error, reload } = useFetch(
    () =>
      roleAccountsApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        customRoleId: roleFilter || undefined,
        status: status === 'ALL' ? undefined : status,
      }),
    [page, debouncedSearch, roleFilter, status],
    { errorMessage: 'Could not load accounts.' }
  )

  const accounts = data?.items ?? []

  const withPageReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const handleSaved = (result, { isEdit }) => {
    if (isEdit) {
      notify(`${result?.name ?? 'Account'} was updated.`, 'success')
      reload()
    } else {
      setCredentials({
        name: result.name,
        customRoleName: result.customRole?.name ?? '',
        email: result.email,
        phone: result.phone,
        username: result.username,
        defaultPassword: result.defaultPassword ?? '123456',
      })
      reload()
      reloadRoles()
    }
  }

  const toggleActive = async (account, active) => {
    try {
      await roleAccountsApi.update(account.id, { isActive: active })
      notify(`${account.name} was ${active ? 'activated' : 'deactivated'}.`, 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, `Could not ${active ? 'activate' : 'deactivate'} account.`), 'error')
    }
  }

  const noRoles = availableRoles.length === 0

  const roleFilterOptions = [
    { value: '', label: 'All roles' },
    ...availableRoles.map((r) => ({ value: r.id, label: `${r.name} (${r.usersInSchool ?? 0})` })),
  ]

  const emptyState = noRoles ? (
    <EmptyState icon={UserPlus} title="No roles available yet" message="Ask the platform admin to create one." />
  ) : debouncedSearch || roleFilter ? (
    <EmptyState icon={UserPlus} title="No matches" message="Try a different search or filter." />
  ) : status === 'INACTIVE' ? (
    <EmptyState icon={UserPlus} title="No inactive accounts" message="Accounts you deactivate show up here." />
  ) : (
    <EmptyState
      icon={UserPlus}
      title="No role accounts yet"
      message="Create login accounts for staff with custom roles."
      action={<Button icon={Plus} onClick={() => setFormModal({})}>Create account</Button>}
    />
  )

  return (
    <AppShell
      title="Role Accounts"
      subtitle="Manage login accounts for custom-role staff"
      actions={<Button icon={Plus} onClick={() => setFormModal({})} disabled={noRoles}>Create account</Button>}
    >
      {availableRoles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {availableRoles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => withPageReset(setRoleFilter)(roleFilter === r.id ? '' : r.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                roleFilter === r.id
                  ? 'bg-board/10 text-board border-board/20'
                  : 'bg-surface text-ink/60 border-line hover:bg-line/40'
              }`}
            >
              {r.name}
              <span className="opacity-70">{r.usersInSchool ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={withPageReset(setSearch)} placeholder="Search by name, email, phone or username..." />
      </div>

      <div className="mb-5 overflow-x-auto">
        <Tabs options={STATUS_OPTIONS} value={status} onChange={withPageReset(setStatus)} />
      </div>

      <Card className="overflow-hidden">
        <AsyncContent loading={loading} error={error} empty={accounts.length === 0} emptyState={emptyState}>
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Username</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {accounts.map((a) => (
                <Tr key={a.id} className="hover:bg-line/20">
                  <Td>
                    <span className="font-semibold text-ink">{a.name}</span>
                  </Td>
                  <Td>
                    <Badge tone="primary">{a.customRole?.name ?? '—'}</Badge>
                  </Td>
                  <Td className="text-ink/60">{a.email}</Td>
                  <Td className="whitespace-nowrap text-ink/60">{a.phone || '—'}</Td>
                  <Td className="text-ink/60 font-mono text-xs">{a.username || '—'}</Td>
                  <Td>
                    <Badge tone={a.isActive ? 'active' : 'inactive'}>{a.isActive ? 'Active' : 'Inactive'}</Badge>
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <IconButton icon={Pencil} label={`Edit ${a.name}`} tone="primary" onClick={() => setFormModal({ account: a })} />
                      {a.isActive ? (
                        <IconButton icon={ToggleLeft} label={`Deactivate ${a.name}`} onClick={() => setDeactivateTarget(a)} />
                      ) : (
                        <IconButton icon={ToggleRight} label={`Activate ${a.name}`} tone="primary" onClick={() => toggleActive(a, true)} />
                      )}
                      <IconButton icon={KeyRound} label={`Reset password for ${a.name}`} onClick={() => setResetTarget({ id: a.id, name: a.name })} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {!loading && !error && accounts.length > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}

      <AccountFormModal
        open={!!formModal}
        onClose={() => setFormModal(null)}
        account={formModal?.account}
        roles={availableRoles}
        onSaved={handleSaved}
        onRolesStale={reloadRoles}
      />

      <CredentialsDialog data={credentials} onClose={() => setCredentials(null)} />

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => toggleActive(deactivateTarget, false)}
        title={`Deactivate ${deactivateTarget?.name}?`}
        message="This will sign them out everywhere. You can reactivate later."
        confirmLabel="Deactivate"
        danger
      />

      <ResetPasswordDialog
        target={resetTarget}
        request={(id) => usersApi.resetPassword(id)}
        onClose={() => setResetTarget(null)}
        onStale={reload}
      />
    </AppShell>
  )
}
