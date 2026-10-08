import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Users } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import { AsyncContent, Badge, Card, EmptyState, Field, SearchInput, Table, THead, Th, Tr, Td, inputClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { formatDate, todayInput } from '../../../utils/format.js'
import { ATTENDANCE_STATUSES, enumMeta } from '../constants.js'
import { attendanceReportApi } from './attendance.api.js'
import { resolveDate } from './components/AttendanceBar.jsx'

const PAGE_SIZE = 30

function StatusBadge({ status }) {
  if (!status) return <Badge tone="neutral">Not marked</Badge>
  const meta = enumMeta(ATTENDANCE_STATUSES, status)
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

export default function ClassAttendancePage() {
  const navigate = useNavigate()
  const { classId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const date = resolveDate(searchParams.get('date'))

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, date])

  const { data, loading, error } = useFetch(
    () => attendanceReportApi.classStudents(classId, { date, page, pageSize: PAGE_SIZE, search: debouncedSearch }),
    [classId, date, page, debouncedSearch],
    { errorMessage: 'Could not load class attendance.' }
  )

  const items = data?.items ?? []
  const notMarkedOnPage = items.filter((i) => !i.status).length

  return (
    <AppShell
      title={data?.className ?? 'Class attendance'}
      subtitle={`Student attendance for ${formatDate(date)}`}
      onBack={() => navigate(`/attendance?date=${date}`)}
    >
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
        <div className="sm:w-56">
          <Field label="Date">
            <input
              type="date"
              className={inputClass}
              value={date}
              max={todayInput()}
              onChange={(e) => setSearchParams({ date: resolveDate(e.target.value) }, { replace: true })}
            />
          </Field>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or admission no..." />
      </div>

      {data && items.length > 0 && notMarkedOnPage === items.length && !debouncedSearch && (
        <p className="text-sm text-ink/55 mb-3">Attendance hasn't been marked for this class on {formatDate(date)} yet.</p>
      )}

      <Card>
        <AsyncContent
          loading={loading && !data}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={Users}
              title={debouncedSearch ? 'No matching students' : 'No students in this class'}
              message={debouncedSearch ? 'Try a different search.' : 'Active students enrolled in this class will appear here.'}
            />
          }
        >
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            <Table>
              <THead>
                <Th>Roll no.</Th>
                <Th>Student</Th>
                <Th>Admission no.</Th>
                <Th>Section</Th>
                <Th>Status</Th>
              </THead>
              <tbody>
                {items.map((s) => (
                  <Tr key={s.studentId}>
                    <Td className="tabular-nums">{s.rollNo ?? '—'}</Td>
                    <Td className="font-semibold text-ink whitespace-nowrap">{s.name}</Td>
                    <Td className="whitespace-nowrap">{s.admissionNo ?? '—'}</Td>
                    <Td>{s.sectionName ?? '—'}</Td>
                    <Td>
                      <StatusBadge status={s.status} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </AsyncContent>
      </Card>

      {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
    </AppShell>
  )
}
