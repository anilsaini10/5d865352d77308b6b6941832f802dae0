import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, UserSquare2, Layers, BookOpen, CalendarDays, ClipboardCheck,
  AlertTriangle, ChevronRight, ListChecks, TrendingUp, TrendingDown,
} from 'lucide-react'
import { Card, PageLoader, Alert, Badge } from '../../../components/ui.jsx'
import { DonutChart, ChartCard } from '../dashboard/components/charts.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorCode } from '../../../api/httpClient.js'
import { formatNumber } from '../../../utils/format.js'
import { analyticsApi } from './analytics.api.js'
import { useAnalyticsFilters } from './useAnalyticsFilters.js'
import { fmtPct, fmtCount, isNotTracked, alertTypeLabel, evidenceLabel } from './analytics.helpers.js'
import AnalyticsShell from './components/AnalyticsShell.jsx'
import FilterBar from './components/FilterBar.jsx'
import KpiCard from './components/KpiCard.jsx'
import NotTrackedCard from './components/NotTrackedCard.jsx'
import AttendanceChips from './components/AttendanceChips.jsx'
import PaperStatsBar from './components/PaperStatsBar.jsx'

function EnrollmentCard({ enrollment }) {
  if (!enrollment) return null
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-ink mb-1">Enrollment</h3>
      <p className="text-xs text-ink/45 mb-4" title="Enrollment = students with attendance this session">
        Students with attendance this session
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-ink/50">Current</p>
          <p className="text-xl font-semibold text-ink">{fmtCount(enrollment.currentEnrollment)}</p>
        </div>
        <div>
          <p className="text-ink/50">Previous</p>
          <p className="text-xl font-semibold text-ink">{fmtCount(enrollment.previousEnrollment)}</p>
        </div>
        <div>
          <p className="text-ink/50">New admissions</p>
          <p className="text-xl font-semibold text-ink">{fmtCount(enrollment.newAdmissions)}</p>
        </div>
        <div>
          <p className="text-ink/50">Growth</p>
          <p className="text-xl font-semibold text-ink flex items-center gap-1">
            {enrollment.growthPercentage != null ? (
              <>
                {enrollment.growthPercentage >= 0
                  ? <TrendingUp size={16} className="text-success" />
                  : <TrendingDown size={16} className="text-coral" />}
                {fmtPct(enrollment.growthPercentage)}
              </>
            ) : '—'}
          </p>
        </div>
        <div>
          <p className="text-ink/50">Retention</p>
          <p className="text-xl font-semibold text-ink">{enrollment.retentionRate != null ? fmtPct(enrollment.retentionRate) : '—'}</p>
        </div>
        <div>
          <p className="text-ink/50">Exited</p>
          <p className="text-xl font-semibold text-ink">{fmtCount(enrollment.exitedSincePreviousPeriod)}</p>
        </div>
      </div>
      {isNotTracked(enrollment.transfers) && (
        <div className="mt-4"><NotTrackedCard title="Transfers" reason={enrollment.transfers.reason} /></div>
      )}
      {isNotTracked(enrollment.withdrawals) && (
        <div className="mt-3"><NotTrackedCard title="Withdrawals" reason={enrollment.withdrawals.reason} /></div>
      )}
    </Card>
  )
}

function HomeworkCard({ homework }) {
  if (!homework) return null
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-ink mb-3">Homework</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-ink/50">Assigned</p>
          <p className="text-xl font-semibold text-ink">{fmtCount(homework.assigned)}</p>
        </div>
        <div>
          <p className="text-ink/50">Completion rate</p>
          <p className="text-xl font-semibold text-ink">{homework.completionRate != null ? fmtPct(homework.completionRate) : '—'}</p>
        </div>
        <div>
          <p className="text-ink/50">Submission rate</p>
          <p className="text-xl font-semibold text-ink">{homework.submissionRate != null ? fmtPct(homework.submissionRate) : '—'}</p>
        </div>
        <div>
          <p className="text-ink/50">Checking rate</p>
          <p className="text-xl font-semibold text-ink">{homework.checkingCompletionRate != null ? fmtPct(homework.checkingCompletionRate) : '—'}</p>
        </div>
      </div>
    </Card>
  )
}

function CalendarCard({ calendar }) {
  if (!calendar) return null
  const { actualWorkingDays, scheduledWorkingDaysToDate, scheduledWorkingDays } = calendar
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-ink mb-1">Working days</h3>
      <p className="text-sm text-ink/60 mt-1">
        Actual <span className="font-semibold text-ink">{fmtCount(actualWorkingDays)}</span> of{' '}
        <span className="font-semibold text-ink">{fmtCount(scheduledWorkingDaysToDate)}</span> so far
        {scheduledWorkingDays != null && <> ({fmtCount(scheduledWorkingDays)} in session)</>}
      </p>
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-ink/50">
        <span>Sundays: {fmtCount(calendar.sundays)}</span>
        <span>Holidays: {fmtCount(calendar.holidays)}</span>
        <span>Vacations: {fmtCount(calendar.vacationDays)}</span>
        <span>Closed: {fmtCount(calendar.schoolClosedDays)}</span>
      </div>
    </Card>
  )
}

function BestClassesCard({ classes }) {
  if (!classes?.length) return null
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-ink mb-3">Best performing classes</h3>
      <div className="space-y-2">
        {classes.map((c) => (
          <div key={c.classId} className="flex items-center justify-between text-sm">
            <span className="text-ink/70">{c.className}</span>
            <div className="flex items-center gap-3">
              <span className="text-ink font-semibold">{fmtPct(c.averagePercentage)}</span>
              <span className="text-xs text-ink/45">Pass: {fmtPct(c.passPercentage)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function TeacherIndicatorsCard({ data }) {
  if (!data) return null
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-ink mb-3">Teacher indicators</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-ink/50">Attendance</p>
          <p className="text-xl font-semibold text-ink">{data.attendancePercentage != null ? fmtPct(data.attendancePercentage) : '—'}</p>
        </div>
        <div>
          <p className="text-ink/50">HW checking rate</p>
          <p className="text-xl font-semibold text-ink">{data.homeworkCheckingRate != null ? fmtPct(data.homeworkCheckingRate) : '—'}</p>
        </div>
        <div>
          <p className="text-ink/50">Missing marks</p>
          <p className="text-xl font-semibold text-ink">{fmtCount(data.papersWithMissingMarks)}</p>
        </div>
      </div>
      {isNotTracked(data.syllabusCompletion) && (
        <div className="mt-4"><NotTrackedCard title="Syllabus completion" reason={data.syllabusCompletion.reason} /></div>
      )}
    </Card>
  )
}

const TODO_ITEMS = [
  { key: 'attendanceNotMarkedToday', label: 'Attendance not marked today', to: '/attendance', isBool: true },
  { key: 'studentLeaveRequests', label: 'Student leave requests', to: '/leave' },
  { key: 'teacherLeaveRequests', label: 'Teacher leave requests', to: '/leave' },
  { key: 'accountRecoveryRequests', label: 'Account recovery requests', to: '/recovery-requests' },
  { key: 'papersWithMissingMarks', label: 'Papers with missing marks', to: '/exams' },
  { key: 'overdueUncheckedHomework', label: 'Overdue unchecked homework', to: null },
]

function PendingTasksCard({ tasks, navigate }) {
  if (!tasks) return null
  const rows = TODO_ITEMS.filter((t) => {
    const v = tasks[t.key]
    return t.isBool ? v === true : v > 0
  })
  if (!rows.length) return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-ink mb-2">To do</h3>
      <p className="text-sm text-ink/45">Nothing pending right now.</p>
    </Card>
  )
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-ink mb-3">To do</h3>
      <div className="space-y-1">
        {rows.map((t) => {
          const v = tasks[t.key]
          const Tag = t.to ? 'button' : 'div'
          return (
            <Tag
              key={t.key}
              type={t.to ? 'button' : undefined}
              onClick={t.to ? () => navigate(t.to) : undefined}
              className={`w-full flex items-center justify-between text-sm rounded-lg px-3 py-2 ${t.to ? 'hover:bg-line/40 cursor-pointer' : ''}`}
            >
              <span className="text-ink/70">{t.label}</span>
              <div className="flex items-center gap-2">
                {!t.isBool && <span className="font-semibold text-ink">{formatNumber(v)}</span>}
                {t.isBool && <Badge tone="warning">Action needed</Badge>}
                {t.to && <ChevronRight size={14} className="text-ink/30" />}
              </div>
            </Tag>
          )
        })}
      </div>
    </Card>
  )
}

function RecentAlertsCard({ alerts, navigate }) {
  if (!alerts) return null
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-ink">Recent alerts</h3>
        {alerts.total > 0 && (
          <button
            type="button"
            onClick={() => navigate('/analytics/alerts')}
            className="text-xs font-semibold text-board hover:underline"
          >
            View all ({formatNumber(alerts.total)})
          </button>
        )}
      </div>
      {alerts.high > 0 && (
        <div className="mb-3">
          <Badge tone="danger">{alerts.high} high severity</Badge>
        </div>
      )}
      {alerts.top?.length > 0 ? (
        <div className="space-y-2">
          {alerts.top.map((a, i) => (
            <div key={a.key || i} className="flex items-start gap-2 text-sm">
              <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${a.severity === 'HIGH' ? 'text-coral' : a.severity === 'MEDIUM' ? 'text-warning' : 'text-ink/35'}`} />
              <div className="min-w-0">
                <p className="text-ink/70">
                  <span className="font-medium text-ink">{a.entity?.name ?? ''}</span>
                  {a.entity?.context != null && <span className="text-ink/45">{` · ${a.entity.context}`}</span>}
                </p>
                <p className="text-xs text-ink/45">{alertTypeLabel(a.type)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink/45">No alerts.</p>
      )}
    </Card>
  )
}

export default function AnalyticsDashboardPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { filters, setFilter, queryParams } = useAnalyticsFilters(['year', 'startDate', 'endDate', 'classId', 'sectionId'])

  const { data, loading, error } = useFetch(
    () => analyticsApi.overview(queryParams).catch((err) => {
      const code = getErrorCode(err)
      if (code === 'VALIDATION_ERROR') throw err
      if (['CLASS_NOT_FOUND', 'SECTION_NOT_FOUND'].includes(code)) {
        const msg = err.response?.data?.error?.message
        if (code === 'CLASS_NOT_FOUND') setFilter('classId', '')
        if (code === 'SECTION_NOT_FOUND') setFilter('sectionId', '')
        if (msg) notify(msg, 'error')
        return null
      }
      throw err
    }),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load analytics overview.' },
  )

  const meta = data?.meta
  const validationError = error && error.includes('VALIDATION') ? error : null
  const d = data || {}

  const genderSegments = d.students ? [
    { key: 'male', label: 'Male', value: d.students.male ?? 0, tone: 'info' },
    { key: 'female', label: 'Female', value: d.students.female ?? 0, tone: 'coral' },
    { key: 'other', label: 'Other', value: d.students.other ?? 0, tone: 'chalk' },
  ] : []

  return (
    <AnalyticsShell title="Analytics" meta={meta}>
      <FilterBar filters={filters} setFilter={setFilter} showClass showSection />

      {validationError && <Alert tone="error" className="mb-4">{validationError}</Alert>}

      {loading ? (
        <PageLoader className="py-24" />
      ) : error && !validationError ? (
        <Alert>{error}</Alert>
      ) : !data ? (
        <p className="text-sm text-ink/50 py-16 text-center">No data for this period.</p>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={GraduationCap} label="Students" value={d.students?.totalActive} />
            <KpiCard icon={UserSquare2} label="Teachers" value={d.teachers?.totalActive} />
            <KpiCard icon={Layers} label="Classes" value={d.structure?.classes} />
            <KpiCard icon={BookOpen} label="Sections" value={d.structure?.sections} />
          </div>

          {/* Gender donut */}
          {d.students && (
            <div className="mt-6">
              <ChartCard title="Gender distribution" subtitle={`${fmtCount(d.students.totalActive)} active students`}>
                <DonutChart segments={genderSegments} centerLabel="Students" />
              </ChartCard>
            </div>
          )}

          {/* Attendance + Academics row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-3">Student attendance</h3>
              <AttendanceChips data={d.studentAttendance} />
            </Card>
            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-3">Teacher attendance</h3>
              <AttendanceChips data={d.teacherAttendance} />
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-3">Academics</h3>
              {d.academics ? (
                <>
                  <div className="flex flex-wrap gap-4 text-sm mb-3">
                    <span className="text-ink/50">Assessed: <span className="font-semibold text-ink">{fmtCount(d.academics.assessedStudents)}</span></span>
                    {d.academics.pendingAssessments > 0 && (
                      <span className="text-chalk-ink">Pending assessments: {fmtCount(d.academics.pendingAssessments)}</span>
                    )}
                    {d.academics.missingMarkEntries > 0 && (
                      <span className="text-coral">Missing marks: {fmtCount(d.academics.missingMarkEntries)}</span>
                    )}
                  </div>
                  <PaperStatsBar data={d.academics} />
                </>
              ) : (
                <p className="text-sm text-ink/45">No academic data yet.</p>
              )}
            </Card>
            <CalendarCard calendar={d.calendar} />
          </div>

          {/* Enrollment + Homework row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
            <EnrollmentCard enrollment={d.enrollment} />
            <HomeworkCard homework={d.homework} />
          </div>

          {/* Weekly tests */}
          {isNotTracked(d.weeklyTests) && (
            <div className="mt-6">
              <NotTrackedCard title="Weekly tests" reason={d.weeklyTests.reason} />
            </div>
          )}

          {/* Best classes + needs support + to-do + alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            <BestClassesCard classes={d.bestPerformingClasses} />

            {d.studentsNeedingSupport && (
              <Card className="p-5">
                <h3 className="font-display font-semibold text-ink mb-1">Students needing support</h3>
                <p className="text-2xl font-semibold text-ink mt-2">{fmtCount(d.studentsNeedingSupport.count)}</p>
                {d.studentsNeedingSupport.thresholds && (
                  <p className="text-xs text-ink/45 mt-1">
                    Thresholds: avg &lt; {d.studentsNeedingSupport.thresholds.averagePercentage ?? 40}%, attendance &lt; {d.studentsNeedingSupport.thresholds.attendancePercentage ?? 75}%
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/analytics/academics?tab=needs-support')}
                  className="mt-3 text-sm font-semibold text-board hover:underline flex items-center gap-1"
                >
                  View details <ChevronRight size={14} />
                </button>
              </Card>
            )}

            <TeacherIndicatorsCard data={d.teacherIndicators} />
            <PendingTasksCard tasks={d.pendingTasks} navigate={navigate} />
            <RecentAlertsCard alerts={d.recentAlerts} navigate={navigate} />
          </div>
        </>
      )}
    </AnalyticsShell>
  )
}
