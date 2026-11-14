import { useState } from 'react'
import { History, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import {
  AsyncContent, Badge, Button, Card, ConfirmDialog, EmptyState, PageLoader,
  Table, THead, Th, Tr, Td, selectClass,
} from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { formatDateTime } from '../../../utils/format.js'
import { useAcademicSessions } from '../academicSessions/useAcademicSessions.js'
import { promotionsApi } from './promotions.api.js'
import { useNavigate } from 'react-router-dom'

const PAGE_SIZE = 15

const STATUS_TONES = {
  COMPLETED: 'success',
  ROLLED_BACK: 'warning',
}

function BatchDetail({ batchId }) {
  const { data, loading, error } = useFetch(() => promotionsApi.historyDetail(batchId), [batchId])

  if (loading) return <PageLoader className="py-6" />
  if (error) return <p className="text-sm text-coral px-5 py-3">{error}</p>

  const records = data?.records ?? data?.students ?? []
  if (records.length === 0) return <p className="text-sm text-ink/50 px-5 py-3">No student records found.</p>

  return (
    <div className="bg-surface/50 border-t border-line">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-line">
            <th className="px-5 py-2 text-left font-semibold text-ink/50">Student</th>
            <th className="px-5 py-2 text-left font-semibold text-ink/50">Adm. No</th>
            <th className="px-5 py-2 text-left font-semibold text-ink/50">From</th>
            <th className="px-5 py-2 text-left font-semibold text-ink/50">To</th>
            <th className="px-5 py-2 text-left font-semibold text-ink/50">Roll No</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.id ?? i} className="border-b border-line last:border-0">
              <td className="px-5 py-2 text-ink font-medium">{r.name}</td>
              <td className="px-5 py-2 text-ink/60">{r.admissionNo}</td>
              <td className="px-5 py-2 text-ink/60">{r.fromClass}{r.fromSection ? ` – ${r.fromSection}` : ''} (Roll {r.fromRollNo ?? '—'})</td>
              <td className="px-5 py-2 text-ink/60">{r.toClass}{r.toSection ? ` – ${r.toSection}` : ''}</td>
              <td className="px-5 py-2 text-ink/60">{r.toRollNo ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PromotionHistoryPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { sessions } = useAcademicSessions()

  const [academicSessionId, setAcademicSessionId] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(null)
  const [rollbackTarget, setRollbackTarget] = useState(null)

  const { data, loading, error, reload } = useFetch(
    () => promotionsApi.history({ page, pageSize: PAGE_SIZE, academicSessionId }),
    [page, academicSessionId],
    { errorMessage: 'Could not load promotion history.' }
  )

  const batches = data?.items ?? []

  const handleRollback = async () => {
    try {
      await promotionsApi.rollback(rollbackTarget.id)
      notify(`Rolled back ${rollbackTarget.promotedCount} students to their previous class.`, 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Rollback failed.'), 'error')
    }
  }

  return (
    <AppShell
      title="Promotion History"
      subtitle="View past promotions and rollback if needed"
      onBack={() => navigate('/promotions')}
      actions={<Button onClick={() => navigate('/promotions')}>New Promotion</Button>}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select
          className={`${selectClass} sm:w-56`}
          value={academicSessionId}
          onChange={(e) => { setAcademicSessionId(e.target.value); setPage(1) }}
          aria-label="Filter by session"
        >
          <option value="">All sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading}
          error={error}
          empty={batches.length === 0}
          emptyState={
            <EmptyState
              icon={History}
              title="No promotion history"
              message="Promotions you perform will appear here."
            />
          }
        >
          <Table>
            <THead>
              <Th />
              <Th>Session</Th>
              <Th>From Class</Th>
              <Th>To Class</Th>
              <Th>Count</Th>
              <Th>Promoted By</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {batches.map((b) => (
                <HistoryRow
                  key={b.id}
                  batch={b}
                  expanded={expanded === b.id}
                  onToggle={() => setExpanded(expanded === b.id ? null : b.id)}
                  onRollback={() => setRollbackTarget(b)}
                />
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {!loading && !error && batches.length > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}

      <ConfirmDialog
        open={!!rollbackTarget}
        onClose={() => setRollbackTarget(null)}
        onConfirm={handleRollback}
        title="Rollback promotion?"
        confirmLabel="Rollback"
        danger
        message={
          <p>
            This will move <span className="font-semibold text-ink">{rollbackTarget?.promotedCount}</span> students
            back to <span className="font-semibold text-ink">{rollbackTarget?.fromClass?.name ?? 'their previous class'}</span>.
            Are you sure?
          </p>
        }
      />
    </AppShell>
  )
}

function HistoryRow({ batch: b, expanded, onToggle, onRollback }) {
  return (
    <>
      <Tr className="hover:bg-line/20 cursor-pointer" onClick={onToggle}>
        <Td>
          {expanded ? <ChevronUp size={14} className="text-ink/40" /> : <ChevronDown size={14} className="text-ink/40" />}
        </Td>
        <Td className="font-medium text-ink">{b.sessionName ?? b.academicSession?.name ?? '—'}</Td>
        <Td>{b.fromClass?.name ?? '—'}</Td>
        <Td>{b.toClass?.name ?? '—'}</Td>
        <Td><span className="font-semibold text-ink">{b.promotedCount ?? b.count ?? 0}</span></Td>
        <Td>{b.promotedBy?.name ?? b.promotedByName ?? '—'}</Td>
        <Td className="whitespace-nowrap">{formatDateTime(b.createdAt ?? b.date)}</Td>
        <Td>
          <Badge tone={STATUS_TONES[b.status] ?? 'neutral'}>{b.status}</Badge>
        </Td>
        <Td className="text-right" onClick={(e) => e.stopPropagation()}>
          {b.status === 'COMPLETED' && (
            <Button size="sm" variant="danger-ghost" icon={RotateCcw} onClick={onRollback}>
              Rollback
            </Button>
          )}
        </Td>
      </Tr>
      {expanded && (
        <tr>
          <td colSpan={9}>
            <BatchDetail batchId={b.id} />
          </td>
        </tr>
      )}
    </>
  )
}
