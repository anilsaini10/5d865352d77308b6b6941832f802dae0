import { useNavigate } from 'react-router-dom'
import { GraduationCap, UserSquare2, BriefcaseBusiness, Layers, Plus } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, Button, PageLoader } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { formatNumber } from '../../../utils/format.js'
import { attendanceReportApi } from '../attendance/attendance.api.js'
import { fetchAllForDate } from '../teacherAttendance/teacherAttendance.utils.js'
import { todayInput } from '../../../utils/format.js'
import { adminDashboardApi } from './dashboard.api.js'
import { BarList, ChartCard, DonutChart, StackedColumns } from './components/charts.jsx'

function StatTile({ icon: Icon, label, value, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-surface border border-line rounded-2xl shadow-card p-5 flex items-center gap-4 hover:border-board/30 hover:shadow-pop transition-shadow"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-board/10 text-board">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-ink/55">{label}</p>
        <p className="text-2xl font-semibold text-ink">{formatNumber(value)}</p>
        {hint && <p className="text-xs text-ink/40 mt-0.5">{hint}</p>}
      </div>
    </button>
  )
}

const STUDENT_SEGMENTS = [
  { key: 'present', label: 'Present', tone: 'success' },
  { key: 'late', label: 'Late', tone: 'warning' },
  { key: 'leave', label: 'Leave', tone: 'info' },
  { key: 'absent', label: 'Absent', tone: 'coral' },
]
const TEACHER_SEGMENTS = [...STUDENT_SEGMENTS, { key: 'holiday', label: 'Holiday', tone: 'board' }]

/** Chart body that handles its own loading / error so one failed request doesn't blank the dashboard. */
function ChartState({ loading, error, children }) {
  if (loading) return <PageLoader className="py-10" />
  if (error) return <Alert>{error}</Alert>
  return children
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: stats, loading, error } = useFetch(() => adminDashboardApi.get(), [], {
    errorMessage: 'Could not load dashboard data.',
  })

  const today = todayInput()
  const studentAtt = useFetch(() => attendanceReportApi.classes({ date: today }), [today], { errorMessage: 'Could not load student attendance.' })
  const teacherAtt = useFetch(() => fetchAllForDate(today), [today], { errorMessage: 'Could not load teacher attendance.' })

  const classRows = studentAtt.data?.classes ?? []
  const studentCounts = Object.fromEntries(STUDENT_SEGMENTS.map((s) => [s.key, classRows.reduce((sum, c) => sum + (c[s.key] ?? 0), 0)]))
  const studentMarked = classRows.reduce((sum, c) => sum + (c.total ?? 0), 0)
  const studentSegments = [
    ...STUDENT_SEGMENTS.map((s) => ({ ...s, value: studentCounts[s.key] })),
    { key: 'unmarked', label: 'Not marked', tone: 'muted', value: Math.max(0, (stats?.studentsCount ?? 0) - studentMarked) },
  ]

  const teacherRecords = teacherAtt.data ?? []
  const teacherCount = (key) => teacherRecords.filter((r) => r.status === key.toUpperCase()).length
  const teacherMarked = teacherRecords.filter((r) => r.status).length
  const teacherSegments = [
    ...TEACHER_SEGMENTS.map((s) => ({ ...s, value: teacherCount(s.key) })),
    { key: 'unmarked', label: 'Not marked', tone: 'muted', value: Math.max(0, (stats?.teachersCount ?? 0) - teacherMarked) },
  ]

  const peopleRows = stats && [
    { key: 'students', label: 'Students', value: stats.studentsCount, tone: 'board', to: '/students' },
    { key: 'teachers', label: 'Teachers', value: stats.teachersCount, tone: 'info', to: '/teachers' },
    { key: 'staff', label: 'Staff', value: stats.staffCount, tone: 'chalk', to: '/staff' },
    { key: 'classes', label: 'Classes', value: stats.classesCount, tone: 'success', to: '/classes' },
  ]

  return (
    <AppShell
      title="Dashboard"
      subtitle={user?.schoolName ? `Overview of ${user.schoolName}` : 'School overview'}
      actions={
        <Button icon={Plus} onClick={() => navigate('/students')} className="hidden sm:inline-flex">
          Add student
        </Button>
      }
    >
      {loading ? (
        <PageLoader className="py-24" />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile icon={GraduationCap} label="Students" value={stats.studentsCount} hint="Active only" onClick={() => navigate('/students')} />
          <StatTile icon={UserSquare2} label="Teachers" value={stats.teachersCount} hint="Active only" onClick={() => navigate('/teachers')} />
          <StatTile icon={BriefcaseBusiness} label="Staff" value={stats.staffCount} hint="Active only" onClick={() => navigate('/staff')} />
          <StatTile icon={Layers} label="Classes" value={stats.classesCount} onClick={() => navigate('/classes')} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
          <ChartCard title="Student attendance today" subtitle="Live from today’s marked attendance">
            <ChartState loading={studentAtt.loading} error={studentAtt.error}>
              <DonutChart segments={studentSegments} centerLabel="students" />
            </ChartState>
          </ChartCard>

          <ChartCard title="Teacher attendance today" subtitle="Final status (admin mark, else teacher check-in)">
            <ChartState loading={teacherAtt.loading} error={teacherAtt.error}>
              <DonutChart segments={teacherSegments} centerLabel="teachers" />
            </ChartState>
          </ChartCard>

          <ChartCard title="School at a glance" subtitle="Active students, teachers, staff and classes">
            <BarList rows={peopleRows} onRowClick={(r) => navigate(r.to)} />
          </ChartCard>

          <ChartCard title="Attendance by class today" subtitle="Students marked in each class">
            <ChartState loading={studentAtt.loading} error={studentAtt.error}>
              {classRows.some((c) => c.total > 0) ? (
                <StackedColumns
                  segments={STUDENT_SEGMENTS}
                  categories={classRows.filter((c) => c.total > 0).map((c) => ({ key: c.classId, label: c.className, parts: c }))}
                />
              ) : (
                <p className="text-sm text-ink/50 py-8 text-center">No attendance has been marked today.</p>
              )}
            </ChartState>
          </ChartCard>
        </div>
        </>
      )}
    </AppShell>
  )
}
