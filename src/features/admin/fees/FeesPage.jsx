import { useState } from 'react'
import { IndianRupee, Send } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import Can from '../../../components/Can.jsx'
import {
  AsyncContent,
  Badge,
  Button,
  Card,
  EmptyState,
  SearchInput,
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
import { formatCurrency } from '../../../utils/format.js'
import { P } from '../../../constants/permissions.js'
import { classesApi } from '../classes/classes.api.js'
import { feesApi } from './fees.api.js'
import FeeReminderModal from './components/FeeReminderModal.jsx'

const PAGE_SIZE = 15

const STATUS_OPTIONS = [
  { value: '', label: 'All status' },
  { value: 'DUE', label: 'Due' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'PAID', label: 'Paid' },
  { value: 'WAIVED', label: 'Waived' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const toneLookup = { PAID: 'active', PARTIAL: 'warning', PENDING: 'neutral', OVERDUE: 'danger', WAIVED: 'neutral', CANCELLED: 'neutral' }

export default function FeesPage() {
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [reminderOpen, setReminderOpen] = useState(false)
  const debouncedSearch = useDebouncedValue(search.trim())

  const { data: classesData } = useFetch(() => classesApi.list(), [], { errorMessage: 'Could not load classes.' })
  const classes = classesData ?? []

  const { data, loading, error } = useFetch(
    () => feesApi.listStudentFees({ page, pageSize: PAGE_SIZE, search: debouncedSearch, classId: classFilter || undefined, status: statusFilter || undefined }),
    [page, debouncedSearch, classFilter, statusFilter],
    { errorMessage: 'Could not load fee records.' },
  )

  const records = data?.items ?? []
  const totals = data?.totals

  const withPageReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const studentIdOf = (r) => r.student?.id
  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  const selectableIds = records.map(studentIdOf).filter(Boolean)
  const uniqueSelected = [...new Set(selectableIds)]

  const toggleAll = () => {
    if (selected.length === uniqueSelected.length) {
      setSelected([])
    } else {
      setSelected(uniqueSelected)
    }
  }

  const handleReminderSent = () => {
    setReminderOpen(false)
    setSelected([])
    notify('Fee reminder sent to parents.', 'success')
  }

  return (
    <AppShell
      title="Fees"
      subtitle="Student fee collection & reminders"
      actions={
        <Can perm={P.FEES_REMINDER}>
          <Button icon={Send} onClick={() => setReminderOpen(true)} disabled={selected.length === 0}>
            Send Reminder ({selected.length})
          </Button>
        </Can>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={withPageReset(setSearch)} placeholder="Search by student name, admission no, or fee title..." />
        <select
          className={`${selectClass} sm:w-48`}
          value={classFilter}
          onChange={(e) => withPageReset(setClassFilter)(e.target.value)}
          aria-label="Filter by class"
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className={`${selectClass} sm:w-40`}
          value={statusFilter}
          onChange={(e) => withPageReset(setStatusFilter)(e.target.value)}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {totals && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card className="p-4 text-center">
            <p className="text-xs text-ink/50 mb-1">Payable</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.payableAmount)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-ink/50 mb-1">Collected</p>
            <p className="text-lg font-semibold text-active">{formatCurrency(totals.paidAmount)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-ink/50 mb-1">Balance</p>
            <p className="text-lg font-semibold text-coral">{formatCurrency(totals.balanceAmount)}</p>
          </Card>
        </div>
      )}

      <AsyncContent loading={loading} error={error}>
        {records.length === 0 ? (
          <Card>
            <EmptyState
              icon={IndianRupee}
              title="No fee records"
              message="No student fee records found. Fee records appear once fee structures are created and assigned to students."
            />
          </Card>
        ) : (
          <>
            <Card className="overflow-x-auto">
              <Table>
                <THead>
                  <Th>
                    <input
                      type="checkbox"
                      checked={records.length > 0 && selected.length === uniqueSelected.length}
                      onChange={toggleAll}
                      className="rounded border-line"
                    />
                  </Th>
                  <Th>Student</Th>
                  <Th>Class</Th>
                  <Th>Fee Title</Th>
                  <Th align="right">Payable</Th>
                  <Th align="right">Paid</Th>
                  <Th align="right">Balance</Th>
                  <Th>Due Date</Th>
                  <Th>Status</Th>
                </THead>
                <tbody>
                  {records.map((r) => (
                    <Tr key={r.id}>
                      <Td>
                        <input
                          type="checkbox"
                          checked={selected.includes(studentIdOf(r))}
                          onChange={() => toggleSelect(studentIdOf(r))}
                          className="rounded border-line"
                        />
                      </Td>
                      <Td bold>{r.student?.name ?? '—'}</Td>
                      <Td muted>{r.student?.class?.name ?? '—'}</Td>
                      <Td muted>{r.title ?? '—'}</Td>
                      <Td align="right">{formatCurrency(r.payableAmount)}</Td>
                      <Td align="right">{formatCurrency(r.paidAmount)}</Td>
                      <Td align="right" bold>{formatCurrency(r.balanceAmount)}</Td>
                      <Td muted>{r.dueDate ?? '—'}</Td>
                      <Td>
                        <Badge tone={toneLookup[r.displayStatus] ?? 'neutral'}>
                          {r.displayStatus}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
            <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
          </>
        )}
      </AsyncContent>

      {reminderOpen && (
        <FeeReminderModal
          studentIds={selected}
          onClose={() => setReminderOpen(false)}
          onSent={handleReminderSent}
        />
      )}
    </AppShell>
  )
}
