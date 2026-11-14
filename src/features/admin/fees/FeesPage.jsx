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
import { getErrorMessage } from '../../../api/httpClient.js'
import { formatCurrency } from '../../../utils/format.js'
import { P } from '../../../constants/permissions.js'
import { classesApi } from '../classes/classes.api.js'
import { feesApi } from './fees.api.js'
import FeeReminderModal from './components/FeeReminderModal.jsx'

const PAGE_SIZE = 15

const FEE_STATUS = { ALL: '', PAID: 'PAID', PARTIAL: 'PARTIAL', UNPAID: 'UNPAID' }

export default function FeesPage() {
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState(FEE_STATUS.ALL)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])
  const [reminderOpen, setReminderOpen] = useState(false)
  const debouncedSearch = useDebouncedValue(search.trim())

  const { data: classesData } = useFetch(() => classesApi.list(), [], { errorMessage: 'Could not load classes.' })
  const classes = classesData ?? []

  const { data, loading, error, reload } = useFetch(
    () => feesApi.list({ page, pageSize: PAGE_SIZE, search: debouncedSearch, classId: classFilter || undefined, status: statusFilter || undefined }),
    [page, debouncedSearch, classFilter, statusFilter],
    { errorMessage: 'Could not load fee records.' },
  )

  const records = data?.items ?? []

  const withPageReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    if (selected.length === records.length) {
      setSelected([])
    } else {
      setSelected(records.map((r) => r.studentId))
    }
  }

  const handleReminderSent = () => {
    setReminderOpen(false)
    setSelected([])
    notify('Fee reminder sent to parents.', 'success')
  }

  const toneLookup = { PAID: 'active', PARTIAL: 'warning', UNPAID: 'danger' }

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
        <SearchInput value={search} onChange={withPageReset(setSearch)} placeholder="Search by student name or roll number..." />
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
          <option value="">All status</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
          <option value="UNPAID">Unpaid</option>
        </select>
      </div>

      <AsyncContent loading={loading} error={error}>
        {records.length === 0 ? (
          <Card>
            <EmptyState
              icon={IndianRupee}
              title="No fee records"
              message="No student fee records found. Fee records appear once the fee structure is configured."
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
                      checked={records.length > 0 && selected.length === records.length}
                      onChange={toggleAll}
                      className="rounded border-line"
                    />
                  </Th>
                  <Th>Student</Th>
                  <Th>Class</Th>
                  <Th>Roll No.</Th>
                  <Th align="right">Total Fee</Th>
                  <Th align="right">Paid</Th>
                  <Th align="right">Balance</Th>
                  <Th>Status</Th>
                </THead>
                <tbody>
                  {records.map((r) => (
                    <Tr key={r.studentId}>
                      <Td>
                        <input
                          type="checkbox"
                          checked={selected.includes(r.studentId)}
                          onChange={() => toggleSelect(r.studentId)}
                          className="rounded border-line"
                        />
                      </Td>
                      <Td bold>{r.studentName}</Td>
                      <Td muted>{r.className ?? '—'}</Td>
                      <Td muted>{r.rollNumber ?? '—'}</Td>
                      <Td align="right">{formatCurrency(r.totalFee)}</Td>
                      <Td align="right">{formatCurrency(r.paidAmount)}</Td>
                      <Td align="right" bold>{formatCurrency(r.balance)}</Td>
                      <Td>
                        <Badge tone={toneLookup[r.status] ?? 'neutral'}>
                          {r.status}
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
