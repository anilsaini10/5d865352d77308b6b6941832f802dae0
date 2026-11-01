import { useState } from 'react'
import { ArrowLeft, Users, Clock, BookOpen, AlertTriangle } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { analyticsApi } from './analytics.api.js'
import { useAnalyticsFilters } from './useAnalyticsFilters.js'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import AnalyticsShell from './components/AnalyticsShell.jsx'
import FilterBar from './components/FilterBar.jsx'
import KpiCard from './components/KpiCard.jsx'
import NotTrackedCard from './components/NotTrackedCard.jsx'
import TrendStat from './components/TrendStat.jsx'
import { Card, AsyncContent, PageLoader, Table, THead, Th, Td, Tr, Tabs, Badge, Alert, Button } from '../../../components/ui.jsx'
import { ChartCard } from '../dashboard/components/charts.jsx'
import { fmtPct, fmtCount, isNotTracked } from './analytics.helpers.js'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'

const PAGE_TABS = [
  { value: 'performance', label: 'Performance' },
  { value: 'growth', label: 'Growth' },
  { value: 'workload', label: 'Workload' },
  { value: 'homework', label: 'Homework' },
  { value: 'weekly-tests', label: 'Weekly Tests' },
  { value: 'syllabus', label: 'Syllabus' },
]

const NOT_TRACKED_FIELDS = [
  { key: 'completedPeriods', title: 'Completed periods' },
  { key: 'syllabusCompletion', title: 'Syllabus completion' },
  { key: 'lessonPlans', title: 'Lesson plans' },
  { key: 'classroomObservations', title: 'Classroom observations' },
  { key: 'remedialSessions', title: 'Remedial sessions' },
  { key: 'weeklyTests', title: 'Weekly tests' },
]

function InlineComparison({ comparison, isPercentage = false }) {
  if (!comparison) return <span className="text-ink/40">—</span>
  const { currentValue, previousValue, percentagePointChange, percentageChange, trendDirection, comparable } = comparison
  const display = currentValue == null ? '—' : isPercentage ? fmtPct(currentValue) : fmtCount(currentValue)

  const colors = { UP: 'text-success', DOWN: 'text-coral', FLAT: 'text-ink/40', UNKNOWN: 'text-ink/40' }
  const arrows = { UP: '↑', DOWN: '↓', FLAT: '→', UNKNOWN: '—' }
  const color = colors[trendDirection] || colors.UNKNOWN

  let changeText = ''
  if (comparable === false) {
    changeText = '—'
  } else if (isPercentage && percentagePointChange != null) {
    changeText = `${percentagePointChange > 0 ? '+' : ''}${percentagePointChange.toFixed(1)}pts`
  } else if (!isPercentage && percentageChange != null) {
    changeText = `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(1)}%`
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-semibold text-ink">{display}</span>
      {changeText && <span className={`text-xs ${color}`}>{arrows[trendDirection]} {changeText}</span>}
    </div>
  )
}

function PerformanceTab({ queryParams, onSelectTeacher }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.teacherPerformance(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load teacher performance.' },
  )

  const teachers = data?.teachers ?? []
  const notTracked = NOT_TRACKED_FIELDS.filter((f) => data && isNotTracked(data[f.key]))

  return (
    <AsyncContent loading={loading} error={error} empty={!data}>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Experience</Th>
              <Th>Attendance %</Th>
              <Th>Average %</Th>
              <Th>Pass %</Th>
              <Th>HW Checking</Th>
              <Th>Periods/wk</Th>
              <Th>Class size</Th>
            </THead>
            <tbody>
              {teachers.map((t) => (
                <Tr
                  key={t.teacherId}
                  className="cursor-pointer hover:bg-line/30"
                  onClick={() => onSelectTeacher(t.teacherId)}
                >
                  <Td className="font-semibold text-ink">{t.name}</Td>
                  <Td><Badge tone={t.status === 'ACTIVE' ? 'active' : 'inactive'}>{t.status?.toLowerCase()}</Badge></Td>
                  <Td>{t.experienceYears != null ? `${t.experienceYears} yrs` : '—'}</Td>
                  <Td>{t.attendance ? fmtPct(t.attendance.attendancePercentage) : '—'}</Td>
                  <Td>{fmtPct(t.academics?.averagePercentage)}</Td>
                  <Td>{fmtPct(t.academics?.passPercentage)}</Td>
                  <Td>{fmtPct(t.homework?.checkingCompletionRate)}</Td>
                  <Td>{t.workload ? fmtCount(t.workload.periodsPerWeek) : '—'}</Td>
                  <Td>{t.context?.averageClassSize != null ? fmtCount(t.context.averageClassSize) : '—'}</Td>
                </Tr>
              ))}
              {teachers.length === 0 && (
                <Tr><Td colSpan={9} className="text-center text-ink/45 py-8">No teacher data for this period.</Td></Tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {notTracked.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {notTracked.map((f) => (
            <NotTrackedCard key={f.key} title={f.title} reason={data[f.key]?.reason} />
          ))}
        </div>
      )}
    </AsyncContent>
  )
}

function TeacherDetailView({ teacherId, queryParams, onBack }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.teacherDetail(teacherId, queryParams),
    [teacherId, JSON.stringify(queryParams)],
    { errorMessage: 'Could not load teacher details.' },
  )

  const t = data?.teacher

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink mb-4"
      >
        <ArrowLeft size={16} /> Back to all teachers
      </button>

      <AsyncContent loading={loading} error={error} empty={!t}>
        {t && (
          <>
            <h2 className="font-display text-xl font-semibold text-ink mb-1">{t.name}</h2>
            <p className="text-sm text-ink/50 mb-6">
              {t.employeeId && `ID: ${t.employeeId} · `}
              {t.experienceYears != null && `${t.experienceYears} yrs experience · `}
              <Badge tone={t.status === 'ACTIVE' ? 'active' : 'inactive'}>{t.status?.toLowerCase()}</Badge>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <KpiCard label="Attendance" value={t.attendance?.attendancePercentage} isPercentage />
              <KpiCard label="Average %" value={t.academics?.averagePercentage} isPercentage />
              <KpiCard label="Pass %" value={t.academics?.passPercentage} isPercentage />
              <KpiCard label="HW Checking" value={t.homework?.checkingCompletionRate} isPercentage />
            </div>

            {data.academicsBySubject?.length > 0 && (
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-line">
                  <h3 className="font-display font-semibold text-ink">By Subject</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <Th>Subject</Th>
                      <Th>Papers</Th>
                      <Th>Average %</Th>
                      <Th>Pass %</Th>
                      <Th>Assessed</Th>
                      <Th>Missing marks</Th>
                    </THead>
                    <tbody>
                      {data.academicsBySubject.map((s, i) => (
                        <Tr key={i}>
                          <Td className="font-semibold text-ink">{s.subjectName}</Td>
                          <Td>{fmtCount(s.gradedPapers)}</Td>
                          <Td>{fmtPct(s.averagePercentage)}</Td>
                          <Td>{fmtPct(s.passPercentage)}</Td>
                          <Td>{fmtCount(s.assessedStudents)}</Td>
                          <Td>{fmtCount(s.missingMarkEntries)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card>
            )}

            {data.academicsByClass?.length > 0 && (
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-line">
                  <h3 className="font-display font-semibold text-ink">By Class</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <Th>Class</Th>
                      <Th>Papers</Th>
                      <Th>Average %</Th>
                      <Th>Pass %</Th>
                      <Th>Assessed</Th>
                    </THead>
                    <tbody>
                      {data.academicsByClass.map((c, i) => (
                        <Tr key={i}>
                          <Td className="font-semibold text-ink">{c.className}</Td>
                          <Td>{fmtCount(c.gradedPapers)}</Td>
                          <Td>{fmtPct(c.averagePercentage)}</Td>
                          <Td>{fmtPct(c.passPercentage)}</Td>
                          <Td>{fmtCount(c.assessedStudents)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card>
            )}

            {data.academicsBySection?.length > 0 && (
              <Card>
                <div className="px-5 py-4 border-b border-line">
                  <h3 className="font-display font-semibold text-ink">By Section</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <Th>Section</Th>
                      <Th>Papers</Th>
                      <Th>Average %</Th>
                      <Th>Pass %</Th>
                      <Th>Assessed</Th>
                    </THead>
                    <tbody>
                      {data.academicsBySection.map((s, i) => (
                        <Tr key={i}>
                          <Td className="font-semibold text-ink">{s.sectionName || s.className}</Td>
                          <Td>{fmtCount(s.gradedPapers)}</Td>
                          <Td>{fmtPct(s.averagePercentage)}</Td>
                          <Td>{fmtPct(s.passPercentage)}</Td>
                          <Td>{fmtCount(s.assessedStudents)}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card>
            )}
          </>
        )}
      </AsyncContent>
    </div>
  )
}

function GrowthTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.teacherGrowth(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load teacher growth data.', enabled: true },
  )

  const teachers = data?.teachers ?? []
  const metrics = [
    { key: 'attendancePercentage', label: 'Attendance %', pct: true },
    { key: 'averagePercentage', label: 'Average %', pct: true },
    { key: 'passPercentage', label: 'Pass %', pct: true },
    { key: 'homeworkSubmissionRate', label: 'HW Submission', pct: true },
    { key: 'homeworkCheckingRate', label: 'HW Checking', pct: true },
  ]

  return (
    <AsyncContent loading={loading} error={error} empty={teachers.length === 0}>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <Th>Teacher</Th>
              {metrics.map((m) => <Th key={m.key}>{m.label}</Th>)}
            </THead>
            <tbody>
              {teachers.map((t, i) => (
                <Tr key={i}>
                  <Td className="font-semibold text-ink whitespace-nowrap">{t.name}</Td>
                  {metrics.map((m) => (
                    <Td key={m.key}>
                      <InlineComparison comparison={t[m.key]} isPercentage={m.pct} />
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </AsyncContent>
  )
}

function WorkloadTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.teacherWorkload(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load teacher workload.' },
  )

  const summary = data?.summary
  const teachers = data?.teachers ?? []
  const chartData = teachers.map((t) => ({ name: t.name?.length > 12 ? t.name.slice(0, 11) + '…' : t.name, periodsPerWeek: t.periodsPerWeek ?? 0 }))

  return (
    <AsyncContent loading={loading} error={error} empty={!data}>
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={Users} label="Active teachers" value={summary.activeTeachers} />
          <KpiCard icon={Clock} label="Total periods/wk" value={summary.totalPeriodsPerWeek} />
          <KpiCard label="Avg periods/wk" value={summary.averagePeriodsPerWeek} />
          <KpiCard icon={AlertTriangle} label="Without timetable" value={summary.teachersWithoutTimetable} />
        </div>
      )}

      {chartData.length > 0 && (
        <ChartCard title="Periods per week" className="mb-6">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line, #E5E7EB)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #E5E7EB', fontSize: '0.875rem' }} />
              <Bar dataKey="periodsPerWeek" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Periods/wk" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <Th>Teacher</Th>
              <Th>Periods/wk</Th>
              <Th>Scheduled</Th>
              <Th>Sections</Th>
              <Th>Subjects</Th>
              <Th>Classes</Th>
              <Th>Students</Th>
              <Th>Class teacher</Th>
              <Th>Invigilation</Th>
            </THead>
            <tbody>
              {teachers.map((t, i) => (
                <Tr key={i}>
                  <Td className="font-semibold text-ink">{t.name}</Td>
                  <Td>{fmtCount(t.periodsPerWeek)}</Td>
                  <Td>{fmtCount(t.scheduledPeriodsToDate)}</Td>
                  <Td>{fmtCount(t.sections)}</Td>
                  <Td>{fmtCount(t.subjects)}</Td>
                  <Td>{fmtCount(t.classes)}</Td>
                  <Td>{fmtCount(t.studentsTaught)}</Td>
                  <Td>{fmtCount(t.classTeacherOfSections)}</Td>
                  <Td>{fmtCount(t.invigilationDuties)}</Td>
                </Tr>
              ))}
              {teachers.length === 0 && (
                <Tr><Td colSpan={9} className="text-center text-ink/45 py-8">No workload data for this period.</Td></Tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </AsyncContent>
  )
}

function HomeworkTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.teacherHomework(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load teacher homework data.' },
  )

  const teachers = data?.teachers ?? []

  return (
    <AsyncContent loading={loading} error={error} empty={teachers.length === 0}>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <Th>Teacher</Th>
              <Th>Assigned</Th>
              <Th>Submission rate</Th>
              <Th>Completion rate</Th>
              <Th>Checking rate</Th>
              <Th>Overdue unchecked</Th>
            </THead>
            <tbody>
              {teachers.map((t, i) => (
                <Tr key={i}>
                  <Td className="font-semibold text-ink">{t.name}</Td>
                  <Td>{fmtCount(t.homeworkAssigned ?? t.assigned)}</Td>
                  <Td>{fmtPct(t.submissionRate)}</Td>
                  <Td>{fmtPct(t.completionRate)}</Td>
                  <Td>{fmtPct(t.checkingCompletionRate)}</Td>
                  <Td>{fmtCount(t.overdueUncheckedHomework)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </AsyncContent>
  )
}

function NotTrackedTab({ fetcher, title, queryParams }) {
  const { data, loading, error } = useFetch(
    () => fetcher(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: `Could not load ${title.toLowerCase()} data.` },
  )

  if (loading) return <PageLoader />
  if (error && !isNotTracked(data)) return <Alert>{error}</Alert>

  return <NotTrackedCard title={title} reason={data?.reason || `${title} tracking is not available yet.`} />
}

export default function TeachersAnalyticsPage() {
  const { filters, setFilter, queryParams } = useAnalyticsFilters(['year', 'startDate', 'endDate', 'teacherId'])
  const [tab, setTab] = useState('performance')
  const [selectedTeacher, setSelectedTeacher] = useState(null)

  const meta = null

  if (selectedTeacher) {
    return (
      <AnalyticsShell title="Teachers" meta={meta}>
        <TeacherDetailView
          teacherId={selectedTeacher}
          queryParams={queryParams}
          onBack={() => setSelectedTeacher(null)}
        />
      </AnalyticsShell>
    )
  }

  return (
    <AnalyticsShell title="Teachers" meta={meta}>
      <FilterBar
        filters={filters}
        setFilter={setFilter}
        showTeacher={tab === 'performance' || tab === 'homework'}
      />

      <Tabs
        options={PAGE_TABS}
        value={tab}
        onChange={(v) => { setTab(v); setSelectedTeacher(null) }}
        className="mb-6"
      />

      {tab === 'performance' && (
        <PerformanceTab queryParams={queryParams} onSelectTeacher={setSelectedTeacher} />
      )}
      {tab === 'growth' && <GrowthTab queryParams={queryParams} />}
      {tab === 'workload' && <WorkloadTab queryParams={queryParams} />}
      {tab === 'homework' && <HomeworkTab queryParams={queryParams} />}
      {tab === 'weekly-tests' && (
        <NotTrackedTab fetcher={analyticsApi.teacherWeeklyTests} title="Weekly Tests" queryParams={queryParams} />
      )}
      {tab === 'syllabus' && (
        <NotTrackedTab fetcher={analyticsApi.teacherSyllabusProgress} title="Syllabus Progress" queryParams={queryParams} />
      )}
    </AnalyticsShell>
  )
}
