import { useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import { AsyncContent, Card, EmptyState, SearchInput, Table, Td, Th, THead, Tabs, Tr } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { timeAgo } from '../../../utils/format.js'
import { recoveryApi } from './recovery.api.js'
import { notifyRecoveryChanged } from './recovery.constants.js'
import { useRecoveryActions } from './components/useRecoveryActions.jsx'
import RecoveryDetailModal from './components/RecoveryDetailModal.jsx'
import { ContactList, RecoveryActionButtons, ResolvedLine, RoleChip, StatusChip } from './components/RecoveryParts.jsx'

const PAGE_SIZE = 20

export default function RecoveryRequestsPage() {
  const [status, setStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState(null)
  const debouncedSearch = useDebouncedValue(search.trim(), 400)

  const { data, loading, error, reload } = useFetch(
    () => recoveryApi.list({ status: status === 'ALL' ? undefined : status, search: debouncedSearch, page, pageSize: PAGE_SIZE }),
    [status, debouncedSearch, page],
    { errorMessage: 'Could not load recovery requests.' }
  )

  // Keep the sidebar badge fresh whenever the page is opened.
  useEffect(() => {
    notifyRecoveryChanged()
  }, [])

  const actions = useRecoveryActions({
    onDone: () => {
      setOpenId(null)
      reload()
    },
    onNotFound: () => setOpenId(null),
  })

  const items = data?.items ?? []
  const counts = data?.statusCounts ?? {}
  const total = (counts.PENDING ?? 0) + (counts.RESOLVED ?? 0) + (counts.REJECTED ?? 0)

  const tabs = [
    { value: 'ALL', label: 'All', count: data ? total : undefined },
    { value: 'PENDING', label: 'Pending', count: data ? counts.PENDING ?? 0 : undefined },
    { value: 'RESOLVED', label: 'Resolved', count: data ? counts.RESOLVED ?? 0 : undefined },
    { value: 'REJECTED', label: 'Rejected', count: data ? counts.REJECTED ?? 0 : undefined },
  ]

  const changeStatus = (value) => {
    setStatus(value)
    setPage(1)
  }
  const changeSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <AppShell title="Recovery Requests" subtitle="Teachers and parents who can't log in. Reset their password or reject the request.">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="overflow-x-auto shrink-0">
          <Tabs options={tabs} value={status} onChange={changeStatus} />
        </div>
        <SearchInput value={search} onChange={changeSearch} placeholder="Search name, email or phone..." />
      </div>

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={KeyRound}
              title={status === 'PENDING' && !debouncedSearch ? 'No pending requests' : 'No requests found'}
              message={debouncedSearch ? 'No requests match your search.' : status === 'PENDING' ? 'Nothing is waiting for review.' : 'Nothing to show here yet.'}
            />
          }
        >
          <Table>
            <THead>
                <Th>Submitted name</Th>
                <Th>Matched account</Th>
                <Th>Contact</Th>
                <Th>Requested</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
            </THead>
            <tbody>
              {items.map((r) => (
                <Tr key={r.id} className="cursor-pointer hover:bg-line/20 align-top" onClick={() => setOpenId(r.id)}>
                  <Td className="font-semibold text-ink">{r.submitted.name}</Td>
                  <Td>
                    <p className="text-ink font-medium mb-1">{r.account.name}</p>
                    <RoleChip role={r.account.role} />
                  </Td>
                  <Td><ContactList submitted={r.submitted} account={r.account} /></Td>
                  <Td className="whitespace-nowrap">{timeAgo(r.updatedAt)}</Td>
                  <Td>
                    <StatusChip status={r.status} />
                    <ResolvedLine item={r} />
                  </Td>
                  <Td>
                    {/* the row opens the detail on click; buttons must not */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <RecoveryActionButtons item={r} busy={actions.busy} onReset={actions.askReset} onReject={actions.askReject} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      <Pagination page={data?.page ?? page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} onChange={setPage} />

      <RecoveryDetailModal
        requestId={openId}
        busy={actions.busy}
        onReset={actions.askReset}
        onReject={actions.askReject}
        onClose={() => setOpenId(null)}
        onGone={() => {
          setOpenId(null)
          reload()
        }}
      />
      {actions.dialogs}
    </AppShell>
  )
}
