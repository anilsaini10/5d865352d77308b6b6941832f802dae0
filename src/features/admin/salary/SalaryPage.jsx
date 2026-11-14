import { useState } from 'react'
import { Wallet, PlayCircle } from 'lucide-react'
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
import { salaryApi } from './salary.api.js'

const PAGE_SIZE = 15

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function currentMonth() {
  const d = new Date()
  return { month: d.getMonth() + 1, year: d.getFullYear() }
}

export default function SalaryPage() {
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [generating, setGenerating] = useState(false)
  const debouncedSearch = useDebouncedValue(search.trim())

  const now = currentMonth()
  const [month, setMonth] = useState(now.month)
  const [year, setYear] = useState(now.year)

  const { data, loading, error, reload } = useFetch(
    () => salaryApi.list({ page, pageSize: PAGE_SIZE, search: debouncedSearch, month, year }),
    [page, debouncedSearch, month, year],
    { errorMessage: 'Could not load salary records.' },
  )

  const records = data?.items ?? []

  const withPageReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await salaryApi.generate({ month, year })
      notify(`Salary generated for ${MONTHS[month - 1]} ${year}.`, 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not generate salary.'), 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <AppShell
      title="Salary"
      subtitle="Teacher & staff monthly salary"
      actions={
        <Can perm={P.SALARY_GENERATE}>
          <Button icon={PlayCircle} onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Salary'}
          </Button>
        </Can>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={withPageReset(setSearch)} placeholder="Search by name or employee ID..." />
        <select
          className={`${selectClass} sm:w-40`}
          value={month}
          onChange={(e) => withPageReset(setMonth)(Number(e.target.value))}
          aria-label="Month"
        >
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          className={`${selectClass} sm:w-32`}
          value={year}
          onChange={(e) => withPageReset(setYear)(Number(e.target.value))}
          aria-label="Year"
        >
          {[now.year - 1, now.year, now.year + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <AsyncContent loading={loading} error={error}>
        {records.length === 0 ? (
          <Card>
            <EmptyState
              icon={Wallet}
              title="No salary records"
              message={`No salary records found for ${MONTHS[month - 1]} ${year}. Generate salary to create records.`}
            />
          </Card>
        ) : (
          <>
            <Card className="overflow-x-auto">
              <Table>
                <THead>
                  <Th>Name</Th>
                  <Th>Employee ID</Th>
                  <Th>Role</Th>
                  <Th align="right">Base Salary</Th>
                  <Th align="right">Deductions</Th>
                  <Th align="right">Net Pay</Th>
                  <Th>Status</Th>
                </THead>
                <tbody>
                  {records.map((r) => (
                    <Tr key={r.id}>
                      <Td bold>{r.name}</Td>
                      <Td muted>{r.employeeId}</Td>
                      <Td muted>{r.role ?? '—'}</Td>
                      <Td align="right">{formatCurrency(r.baseSalary)}</Td>
                      <Td align="right" className="text-coral">{formatCurrency(r.deductions ?? 0)}</Td>
                      <Td align="right" bold>{formatCurrency(r.netPay)}</Td>
                      <Td>
                        <Badge tone={r.status === 'PAID' ? 'active' : 'neutral'}>
                          {r.status ?? 'Pending'}
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
    </AppShell>
  )
}
