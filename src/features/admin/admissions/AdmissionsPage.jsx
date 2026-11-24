import { useState } from 'react'
import { Plus, ClipboardList, Eye, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import {
  AsyncContent, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton,
  SearchInput, Table, THead, Th, Tr, Td, selectClass,
} from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { formatDate } from '../../../utils/format.js'
import { useClasses } from '../classes/useClasses.js'
import { useAcademicSessions } from '../academicSessions/useAcademicSessions.js'
import { admissionsApi } from './admissions.api.js'

const PAGE_SIZE = 15

const STATUS_TONES = {
  INQUIRY: 'neutral',
  APPLIED: 'info',
  APPROVED: 'success',
  ENROLLED: 'primary',
  REJECTED: 'danger',
  WITHDRAWN: 'warning',
}

const STATUS_OPTIONS = ['INQUIRY', 'APPLIED', 'APPROVED', 'ENROLLED', 'REJECTED', 'WITHDRAWN']

function StatCard({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[7rem] rounded-xl border p-4 text-left transition-colors ${
        active ? 'bg-board/5 border-board/30 ring-2 ring-board/15' : 'bg-surface border-line hover:bg-line/30'
      }`}
    >
      <p className="text-2xl font-bold text-ink">{count ?? 0}</p>
      <p className="text-xs font-semibold text-ink/50 mt-0.5 uppercase tracking-wide">{label}</p>
    </button>
  )
}

export default function AdmissionsPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { classes } = useClasses()
  const { sessions } = useAcademicSessions()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classId, setClassId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: stats } = useFetch(
    () => admissionsApi.stats(sessionId || undefined),
    [sessionId],
    { errorMessage: 'Could not load stats.' }
  )

  const { data, loading, error, reload } = useFetch(
    () => admissionsApi.list({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch,
      status: statusFilter || undefined,
      classId: classId || undefined,
      academicSessionId: sessionId || undefined,
    }),
    [page, debouncedSearch, statusFilter, classId, sessionId],
    { errorMessage: 'Could not load admissions.' }
  )

  const items = data?.items ?? []

  const withPageReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const toggleStatus = (s) => {
    setStatusFilter((prev) => prev === s ? '' : s)
    setPage(1)
  }

  const confirmDelete = async () => {
    try {
      await admissionsApi.remove(deleteTarget.id)
      notify('Admission deleted.', 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete admission.'), 'error')
    }
  }

  return (
    <AppShell
      title="Admissions"
      subtitle="Manage inquiries, applications and enrollment"
      actions={<Button icon={Plus} onClick={() => navigate('/admissions/new')}>New Admission</Button>}
    >
      {stats && (
        <div className="flex flex-wrap gap-3 mb-6">
          <StatCard label="Total" count={stats.total} active={!statusFilter} onClick={() => toggleStatus('')} />
          {STATUS_OPTIONS.map((s) => (
            <StatCard key={s} label={s} count={stats.byStatus?.[s] ?? 0} active={statusFilter === s} onClick={() => toggleStatus(s)} />
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={withPageReset(setSearch)} placeholder="Search by name, application no..." />
        <select className={`${selectClass} sm:w-44`} value={classId} onChange={(e) => withPageReset(setClassId)(e.target.value)}>
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className={`${selectClass} sm:w-44`} value={sessionId} onChange={(e) => withPageReset(setSessionId)(e.target.value)}>
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
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={ClipboardList}
              title={statusFilter || search || classId ? 'No matching admissions' : 'No admissions yet'}
              message={statusFilter || search || classId ? 'Try different filters.' : 'Start tracking inquiries and applications.'}
              action={!statusFilter && !search && !classId && <Button icon={Plus} onClick={() => navigate('/admissions/new')}>New Admission</Button>}
            />
          }
        >
          <Table>
            <THead>
              <Th>Application No</Th>
              <Th>Student</Th>
              <Th>Class</Th>
              <Th>Parent</Th>
              <Th>Phone</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {items.map((a) => (
                <Tr key={a.id} className="hover:bg-line/20 cursor-pointer" onClick={() => navigate(`/admissions/${a.id}`)}>
                  <Td className="font-mono text-xs font-semibold text-ink">{a.applicationNo}</Td>
                  <Td>
                    <span className="font-semibold text-ink">{a.studentName}</span>
                  </Td>
                  <Td>{a.class?.name ?? a.className ?? '—'}</Td>
                  <Td>{a.parentName}</Td>
                  <Td className="whitespace-nowrap">{a.parentPhone}</Td>
                  <Td>
                    <Badge tone={STATUS_TONES[a.status] ?? 'neutral'}>{a.status}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap">{formatDate(a.createdAt)}</Td>
                  <Td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <IconButton icon={Eye} label="View" onClick={() => navigate(`/admissions/${a.id}`)} />
                    <IconButton icon={Pencil} label="Edit" tone="primary" onClick={() => navigate(`/admissions/${a.id}`)} />
                    {a.status !== 'ENROLLED' && (
                      <IconButton icon={Trash2} label="Delete" tone="danger" onClick={() => setDeleteTarget(a)} />
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {!loading && !error && items.length > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this admission?"
        confirmLabel="Delete"
        message={<p>Delete the admission for <span className="font-semibold text-ink">{deleteTarget?.studentName}</span>? This cannot be undone.</p>}
      />
    </AppShell>
  )
}
