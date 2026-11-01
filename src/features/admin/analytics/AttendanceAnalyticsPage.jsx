import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserCheck, CalendarDays, AlertTriangle, ShieldAlert } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { Card, AsyncContent, Tabs, Table, THead, Th, Td, Tr, Badge, Alert, PageLoader } from '../../../components/ui.jsx'
import Pagination from '../../../components/Pagination.jsx'
import { ChartCard } from '../dashboard/components/charts.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { analyticsApi } from './analytics.api.js'
import { useAnalyticsFilters } from './useAnalyticsFilters.js'
import AnalyticsShell from './components/AnalyticsShell.jsx'
import FilterBar from './components/FilterBar.jsx'
import KpiCard from './components/KpiCard.jsx'
import AttendanceChips from './components/AttendanceChips.jsx'
import { fmtPct, fmtCount, fmtMonth, fmtDay } from './analytics.helpers.js'

const TAB_OPTIONS = [
  { value: 'student', label: 'Student Attendance' },
  { value: 'trend', label: 'Trend' },
  { value: 'low', label: 'Low Attendance' },
  { value: 'repeated', label: 'Repeated Absences' },
  { value: 'teacher', label: 'Teacher Attendance' },
  { value: 'calendar', label: 'School Calendar' },
]

const GRANULARITY_OPTIONS = [
  { value: 'DAY', label: 'Day' },
  { value: 'WEEK', label: 'Week' },
  { value: 'MONTH', label: 'Month' },
]

function StudentAttendanceTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.studentAttendance(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load student attendance.' },
  )

  return (
    <AsyncContent loading={loading} error={error} empty={false}>
      {data && (
        <div className="space-y-6">
          {data.today === null && (
            <Alert tone="warning">Attendance has not been marked today.</Alert>
          )}

          {data.summary?.recordsOnNonWorkingDays > 0 && (
            <Alert tone="info">
              {data.summary.recordsOnNonWorkingDays} records on Sundays/holidays were excluded.
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-3">Today</h3>
              {data.today ? <AttendanceChips data={data.today} /> : <p className="text-sm text-ink/45">Not marked yet</p>}
            </Card>
            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-3">This Week</h3>
              {data.thisWeek ? <AttendanceChips data={data.thisWeek} /> : <p className="text-sm text-ink/45">No data</p>}
            </Card>
            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-3">This Month</h3>
              {data.thisMonth ? <AttendanceChips data={data.thisMonth} /> : <p className="text-sm text-ink/45">No data</p>}
            </Card>
            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-3">Session</h3>
              {data.summary ? <AttendanceChips data={data.summary} /> : <p className="text-sm text-ink/45">No data</p>}
            </Card>
          </div>

          {data.calendar && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-3">Working Days</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><span className="text-ink/50">Scheduled</span><p className="font-semibold text-ink">{fmtCount(data.calendar.scheduledWorkingDays)}</p></div>
                <div><span className="text-ink/50">To date</span><p className="font-semibold text-ink">{fmtCount(data.calendar.scheduledWorkingDaysToDate)}</p></div>
                <div><span className="text-ink/50">Actual</span><p className="font-semibold text-ink">{fmtCount(data.calendar.actualWorkingDays)}</p></div>
                <div><span className="text-ink/50">Sundays</span><p className="font-semibold text-ink">{fmtCount(data.calendar.sundays)}</p></div>
              </div>
            </Card>
          )}

          {data.byClass?.length > 0 && (
            <Card>
              <h3 className="font-display font-semibold text-ink px-5 pt-5 pb-3">By Class</h3>
              <Table>
                <THead><Th>Class</Th><Th>Attendance</Th><Th>Present</Th><Th>Absent</Th><Th>Late</Th><Th>Leave</Th></THead>
                <tbody>
                  {data.byClass.map((c) => (
                    <Tr key={c.classId || c.className}>
                      <Td className="font-semibold text-ink">{c.className}</Td>
                      <Td>{fmtPct(c.attendancePercentage)}</Td>
                      <Td>{fmtCount(c.present)}</Td>
                      <Td>{fmtCount(c.absent)}</Td>
                      <Td>{fmtCount(c.late)}</Td>
                      <Td>{fmtCount(c.approvedLeave)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          {data.bySection?.length > 0 && (
            <Card>
              <h3 className="font-display font-semibold text-ink px-5 pt-5 pb-3">By Section</h3>
              <Table>
                <THead><Th>Section</Th><Th>Attendance</Th><Th>Present</Th><Th>Absent</Th><Th>Late</Th><Th>Leave</Th></THead>
                <tbody>
                  {data.bySection.map((s) => (
                    <Tr key={s.sectionId || s.sectionName}>
                      <Td className="font-semibold text-ink">{s.sectionName}</Td>
                      <Td>{fmtPct(s.attendancePercentage)}</Td>
                      <Td>{fmtCount(s.present)}</Td>
                      <Td>{fmtCount(s.absent)}</Td>
                      <Td>{fmtCount(s.late)}</Td>
                      <Td>{fmtCount(s.approvedLeave)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          {data.byMonth?.length > 0 && (
            <Card>
              <h3 className="font-display font-semibold text-ink px-5 pt-5 pb-3">Monthly Breakdown</h3>
              <Table>
                <THead><Th>Month</Th><Th>Days Marked</Th><Th>Attendance</Th><Th>Present</Th><Th>Absent</Th><Th>Late</Th></THead>
                <tbody>
                  {data.byMonth.map((m) => (
                    <Tr key={m.period}>
                      <Td className="font-semibold text-ink">{fmtMonth(m.period)}</Td>
                      <Td>{fmtCount(m.markedDays)}</Td>
                      <Td>{fmtPct(m.attendancePercentage)}</Td>
                      <Td>{fmtCount(m.present)}</Td>
                      <Td>{fmtCount(m.absent)}</Td>
                      <Td>{fmtCount(m.late)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </div>
      )}
    </AsyncContent>
  )
}

function TrendTab({ queryParams }) {
  const [granularity, setGranularity] = useState('MONTH')
  const { data, loading, error } = useFetch(
    () => analyticsApi.attendanceTrend({ ...queryParams, granularity }),
    [JSON.stringify(queryParams), granularity],
    { errorMessage: 'Could not load attendance trend.' },
  )

  const points = (data?.points ?? []).filter((p) => p.attendancePercentage != null)

  return (
    <div className="space-y-4">
      <Tabs options={GRANULARITY_OPTIONS} value={granularity} onChange={setGranularity} />
      <AsyncContent loading={loading} error={error} empty={points.length === 0} emptyState={<p className="text-sm text-ink/50 py-8 text-center">No data for this period.</p>}>
        <ChartCard title="Attendance Trend">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="var(--color-ink)" opacity={0.4} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--color-ink)" opacity={0.4} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Attendance']} />
              <Line type="monotone" dataKey="attendancePercentage" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="Attendance %" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </AsyncContent>
    </div>
  )
}

function LowAttendanceTab({ queryParams }) {
  const navigate = useNavigate()
  const [threshold, setThreshold] = useState(75)
  const [page, setPage] = useState(1)

  const { data, loading, error } = useFetch(
    () => analyticsApi.lowAttendanceStudents({ ...queryParams, threshold, minMarkedDays: 5, page, pageSize: 20 }),
    [JSON.stringify(queryParams), threshold, page],
    { errorMessage: 'Could not load low attendance students.' },
  )

  const items = data?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-surface border border-line rounded-xl p-4">
        <label className="text-sm font-semibold text-ink/60 whitespace-nowrap">
          Threshold: {threshold}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={threshold}
          onChange={(e) => { setThreshold(Number(e.target.value)); setPage(1) }}
          className="flex-1 accent-board"
        />
      </div>
      <Card>
        <AsyncContent loading={loading} error={error} empty={items.length === 0} emptyState={<p className="text-sm text-ink/50 py-8 text-center">No students below {threshold}% attendance.</p>}>
          <Table>
            <THead>
              <Th>Name</Th><Th>Adm. No</Th><Th>Class</Th><Th>Section</Th><Th>Attendance</Th>
              <Th>Present</Th><Th>Absent</Th><Th>Late</Th><Th>Leave</Th><Th>Days</Th><Th />
            </THead>
            <tbody>
              {items.map((s) => (
                <Tr key={s.studentId}>
                  <Td className="font-semibold text-ink">{s.name}</Td>
                  <Td>{s.admissionNo}</Td>
                  <Td>{s.className}</Td>
                  <Td>{s.sectionName}</Td>
                  <Td>
                    <span className={s.attendancePercentage != null && s.attendancePercentage < threshold ? 'text-coral font-semibold' : ''}>
                      {fmtPct(s.attendancePercentage)}
                    </span>
                  </Td>
                  <Td>{fmtCount(s.present)}</Td>
                  <Td>{fmtCount(s.absent)}</Td>
                  <Td>{fmtCount(s.late)}</Td>
                  <Td>{fmtCount(s.approvedLeave)}</Td>
                  <Td>{fmtCount(s.markedDays)}</Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => navigate(`/analytics/interventions?entityType=STUDENT&entityId=${s.studentId}&title=${encodeURIComponent(`Low attendance: ${s.name}`)}`)}
                      className="text-xs font-semibold text-board hover:underline whitespace-nowrap"
                    >
                      Create intervention
                    </button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          {data && <div className="px-5 pb-4"><Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} /></div>}
        </AsyncContent>
      </Card>
    </div>
  )
}

function RepeatedAbsencesTab({ queryParams }) {
  const [page, setPage] = useState(1)
  const { data, loading, error } = useFetch(
    () => analyticsApi.repeatedAbsences({ ...queryParams, minConsecutive: 3, page, pageSize: 20 }),
    [JSON.stringify(queryParams), page],
    { errorMessage: 'Could not load repeated absences.' },
  )

  const items = data?.items ?? []

  return (
    <div className="space-y-4">
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KpiCard icon={Users} label="Students with repeated absences" value={data.summary.students} />
          <KpiCard icon={ShieldAlert} label="Ongoing streaks" value={data.summary.ongoing} />
        </div>
      )}
      <Card>
        <AsyncContent loading={loading} error={error} empty={items.length === 0} emptyState={<p className="text-sm text-ink/50 py-8 text-center">No repeated absences found.</p>}>
          <Table>
            <THead>
              <Th>Name</Th><Th>Class</Th><Th>Section</Th><Th>Current Streak</Th>
              <Th>Longest Streak</Th><Th>Total Absences</Th><Th>Last Absent</Th><Th>Status</Th>
            </THead>
            <tbody>
              {items.map((s) => (
                <Tr key={s.studentId}>
                  <Td className="font-semibold text-ink">{s.name}</Td>
                  <Td>{s.className}</Td>
                  <Td>{s.sectionName}</Td>
                  <Td>{fmtCount(s.currentStreak)}</Td>
                  <Td>{fmtCount(s.longestStreak)}</Td>
                  <Td>{fmtCount(s.absences)}</Td>
                  <Td>{fmtDay(s.lastAbsentOn)}</Td>
                  <Td>{s.ongoing ? <Badge tone="danger">Ongoing</Badge> : <Badge tone="neutral">Resolved</Badge>}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          {data && <div className="px-5 pb-4"><Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} /></div>}
        </AsyncContent>
      </Card>
    </div>
  )
}

function TeacherAttendanceTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.teacherAttendance(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load teacher attendance.' },
  )

  const teachers = data?.teachers ?? []

  return (
    <AsyncContent loading={loading} error={error} empty={false}>
      {data && (
        <div className="space-y-6">
          {data.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard icon={Users} label="Active Teachers" value={data.summary.activeTeachers} />
              <KpiCard icon={UserCheck} label="Attendance" value={data.summary.attendancePercentage} isPercentage />
              <KpiCard icon={CalendarDays} label="Expected Teacher Days" value={data.summary.expectedTeacherDays} />
              <KpiCard label="Marking Coverage" value={data.summary.markingCoveragePercentage} isPercentage />
            </div>
          )}

          {data.summary?.leaveRequests && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-3">Leave Requests</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                <div><span className="text-ink/50">Total</span><p className="font-semibold text-ink">{fmtCount(data.summary.leaveRequests.total)}</p></div>
                <div><span className="text-ink/50">Approved</span><p className="font-semibold text-success">{fmtCount(data.summary.leaveRequests.approved)}</p></div>
                <div><span className="text-ink/50">Pending</span><p className="font-semibold text-chalk-ink">{fmtCount(data.summary.leaveRequests.pending)}</p></div>
                <div><span className="text-ink/50">Rejected</span><p className="font-semibold text-coral">{fmtCount(data.summary.leaveRequests.rejected)}</p></div>
                <div><span className="text-ink/50">Approved Days</span><p className="font-semibold text-ink">{fmtCount(data.summary.leaveRequests.approvedLeaveDays)}</p></div>
              </div>
            </Card>
          )}

          {teachers.length > 0 && (
            <Card>
              <Table>
                <THead>
                  <Th>Name</Th><Th>Emp. ID</Th><Th>Status</Th><Th>Attendance</Th>
                  <Th>Present</Th><Th>Absent</Th><Th>Late</Th><Th>Leave</Th><Th>Records</Th>
                </THead>
                <tbody>
                  {teachers.map((t) => (
                    <Tr key={t.teacherId}>
                      <Td className="font-semibold text-ink">{t.name}</Td>
                      <Td>{t.employeeId || '—'}</Td>
                      <Td><Badge tone={t.status === 'ACTIVE' ? 'active' : 'inactive'}>{t.status?.toLowerCase()}</Badge></Td>
                      <Td>{fmtPct(t.attendancePercentage)}</Td>
                      <Td>{fmtCount(t.present)}</Td>
                      <Td>{fmtCount(t.absent)}</Td>
                      <Td>{fmtCount(t.late)}</Td>
                      <Td>{fmtCount(t.approvedLeave)}</Td>
                      <Td>{fmtCount(t.markedRecords)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </div>
      )}
    </AsyncContent>
  )
}

function SchoolCalendarTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.schoolCalendar(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load school calendar.' },
  )

  const months = data?.months ?? []

  return (
    <AsyncContent loading={loading} error={error} empty={false}>
      {data && (
        <div className="space-y-6">
          {data.summary && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-3">Calendar Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><span className="text-ink/50">Total Days</span><p className="font-semibold text-ink">{fmtCount(data.summary.totalDays)}</p></div>
                <div><span className="text-ink/50">Sundays</span><p className="font-semibold text-ink">{fmtCount(data.summary.sundays)}</p></div>
                <div><span className="text-ink/50">Holidays</span><p className="font-semibold text-ink">{fmtCount(data.summary.holidayDays)}</p></div>
                <div><span className="text-ink/50">Vacations</span><p className="font-semibold text-ink">{fmtCount(data.summary.vacationDays)}</p></div>
                <div><span className="text-ink/50">Scheduled Working</span><p className="font-semibold text-ink">{fmtCount(data.summary.scheduledWorkingDays)}</p></div>
                <div><span className="text-ink/50">To Date</span><p className="font-semibold text-ink">{fmtCount(data.summary.scheduledWorkingDaysToDate)}</p></div>
                <div><span className="text-ink/50">Actual Working</span><p className="font-semibold text-ink">{fmtCount(data.summary.actualWorkingDays)}</p></div>
                <div><span className="text-ink/50">Unmarked Days</span><p className="font-semibold text-coral">{fmtCount(data.summary.unmarkedWorkingDays)}</p></div>
              </div>
            </Card>
          )}

          {months.length > 0 && (
            <ChartCard title="Scheduled vs Actual Working Days" subtitle="By month">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                  <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11 }} stroke="var(--color-ink)" opacity={0.4} />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--color-ink)" opacity={0.4} />
                  <Tooltip labelFormatter={fmtMonth} />
                  <Legend />
                  <Bar dataKey="scheduledWorkingDays" name="Scheduled" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualWorkingDays" name="Actual" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {data.unmarkedWorkingDates?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-3">Attendance not taken on these days</h3>
              <div className="flex flex-wrap gap-2">
                {data.unmarkedWorkingDates.map((d) => (
                  <span key={d} className="inline-flex items-center rounded-full bg-coral/10 text-coral border border-coral/25 px-2.5 py-0.5 text-xs font-semibold">
                    {fmtDay(d)}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </AsyncContent>
  )
}

export default function AttendanceAnalyticsPage() {
  const [tab, setTab] = useState('student')
  const { filters, setFilter, queryParams } = useAnalyticsFilters(['year', 'startDate', 'endDate', 'classId', 'sectionId', 'teacherId'])
  const { notify } = useToast()

  const { data: studentData } = useFetch(
    () => analyticsApi.studentAttendance(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load attendance.', enabled: tab === 'student' },
  )

  return (
    <AnalyticsShell title="Attendance Analytics" meta={studentData?.meta}>
      <FilterBar
        filters={filters}
        setFilter={setFilter}
        showClass
        showSection
        showTeacher={tab === 'teacher'}
      />

      <Tabs options={TAB_OPTIONS} value={tab} onChange={setTab} className="mb-6" />

      {tab === 'student' && <StudentAttendanceTab queryParams={queryParams} />}
      {tab === 'trend' && <TrendTab queryParams={queryParams} />}
      {tab === 'low' && <LowAttendanceTab queryParams={queryParams} />}
      {tab === 'repeated' && <RepeatedAbsencesTab queryParams={queryParams} />}
      {tab === 'teacher' && <TeacherAttendanceTab queryParams={queryParams} />}
      {tab === 'calendar' && <SchoolCalendarTab queryParams={queryParams} />}
    </AnalyticsShell>
  )
}
