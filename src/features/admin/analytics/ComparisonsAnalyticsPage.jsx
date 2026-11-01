import { useState } from 'react'
import { Info } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { analyticsApi } from './analytics.api.js'
import { useAnalyticsFilters } from './useAnalyticsFilters.js'
import { useFetch } from '../../../hooks/useFetch.js'
import AnalyticsShell from './components/AnalyticsShell.jsx'
import FilterBar from './components/FilterBar.jsx'
import TrendStat from './components/TrendStat.jsx'
import NotTrackedCard from './components/NotTrackedCard.jsx'
import KpiCard from './components/KpiCard.jsx'
import { Card, AsyncContent, Tabs, Table, THead, Th, Td, Tr, Badge, Alert } from '../../../components/ui.jsx'
import { ChartCard } from '../dashboard/components/charts.jsx'
import { fmtPct, fmtCount, fmtMonth, fmtDay, isNotTracked } from './analytics.helpers.js'

const TABS = [
  { value: 'year', label: 'Year comparison' },
  { value: 'term', label: 'Term comparison' },
  { value: 'monthly', label: 'Monthly trends' },
  { value: 'class', label: 'Class comparison' },
  { value: 'subject', label: 'Subject comparison' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'cocurricular', label: 'Co-curricular' },
  { value: 'participation', label: 'Participation' },
]

const PCT_METRICS = new Set([
  'studentAttendancePercentage', 'teacherAttendancePercentage',
  'academicAveragePercentage', 'passPercentage',
  'homeworkSubmissionRate', 'homeworkCompletionRate', 'homeworkCheckingRate',
  'retentionRate',
])

const METRIC_LABELS = {
  enrollment: 'Enrollment',
  studentAttendancePercentage: 'Student attendance',
  teacherAttendancePercentage: 'Teacher attendance',
  academicAveragePercentage: 'Academic average',
  passPercentage: 'Pass rate',
  homeworkAssigned: 'Homework assigned',
  homeworkSubmissionRate: 'Submission rate',
  homeworkCompletionRate: 'Completion rate',
  homeworkCheckingRate: 'Checking rate',
  retentionRate: 'Retention rate',
}

const TREND_METRICS = [
  { key: 'attendancePercentage', label: 'Attendance %', color: '#4F46E5' },
  { key: 'academicAveragePercentage', label: 'Academic avg %', color: '#22C55E' },
  { key: 'passPercentage', label: 'Pass %', color: '#3B82F6' },
  { key: 'homeworkSubmissionRate', label: 'HW submission %', color: '#F59E0B' },
  { key: 'scheduledWorkingDays', label: 'Working days', color: '#6366F1' },
  { key: 'gradedPapers', label: 'Graded papers', color: '#EF4444' },
  { key: 'homeworkAssigned', label: 'HW assigned', color: '#F97316' },
  { key: 'newAdmissions', label: 'New admissions', color: '#8B5CF6' },
]

function InlineComparison({ comparison, isPercentage }) {
  if (!comparison) return <span className="text-ink/40">—</span>
  const { currentValue, trendDirection, percentagePointChange, percentageChange, comparable } = comparison
  const display = currentValue == null ? '—' : isPercentage ? fmtPct(currentValue) : fmtCount(currentValue)
  if (comparable === false) return <span className="text-ink/70">{display} <span className="text-ink/35 text-xs">n/a</span></span>
  const change = isPercentage ? percentagePointChange : percentageChange
  const suffix = isPercentage ? ' pts' : '%'
  const colors = { UP: 'text-success', DOWN: 'text-coral', FLAT: 'text-ink/40', UNKNOWN: 'text-ink/40' }
  return (
    <span className="text-ink/70">
      {display}
      {change != null && (
        <span className={`ml-1.5 text-xs font-semibold ${colors[trendDirection] || 'text-ink/40'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}{suffix}
        </span>
      )}
    </span>
  )
}

function YearComparisonTab({ queryParams }) {
  const { data, loading, error } = useFetch(() => analyticsApi.yearComparison(queryParams), [JSON.stringify(queryParams)])
  const metrics = data?.metrics
  const period = data?.comparisonPeriod

  return (
    <AsyncContent loading={loading} error={error} empty={!metrics} emptyState={<p className="text-sm text-ink/50 py-8 text-center">No data for this period.</p>}>
      {period?.truncatedToElapsed && (
        <Alert tone="info" className="mb-4">
          Compared with the same point last session ({fmtDay(period.current?.startDate)} – {fmtDay(period.current?.endDate)}).
        </Alert>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics && Object.entries(METRIC_LABELS).map(([key, label]) => {
          const m = metrics[key]
          if (!m) return null
          const isPct = PCT_METRICS.has(key)
          return (
            <TrendStat
              key={key}
              label={label}
              value={m.currentValue}
              comparison={m}
              isPercentage={isPct}
            />
          )
        })}
      </div>
    </AsyncContent>
  )
}

function TermComparisonTab({ queryParams }) {
  const { data, loading, error } = useFetch(() => analyticsApi.termComparison({ ...queryParams, terms: 3 }), [JSON.stringify(queryParams)])
  const terms = data?.terms ?? []

  return (
    <AsyncContent loading={loading} error={error} empty={terms.length === 0} emptyState={<p className="text-sm text-ink/50 py-8 text-center">No term data available.</p>}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {terms.map((t) => (
          <Card key={t.term} className={`p-5 ${!t.started ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-display font-semibold text-ink">Term {t.term}</h3>
              {t.inProgress && <Badge tone="info">In progress</Badge>}
              {!t.started && <Badge tone="neutral">Not started</Badge>}
            </div>
            <p className="text-xs text-ink/45 mb-4">{fmtDay(t.startDate)} – {fmtDay(t.endDate)}</p>
            {t.values && (
              <div className="space-y-2 text-sm">
                {Object.entries(METRIC_LABELS).map(([key, label]) => {
                  const val = t.values?.[key]
                  if (val === undefined) return null
                  const isPct = PCT_METRICS.has(key)
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-ink/55">{label}</span>
                      <span className="font-semibold text-ink tabular-nums">
                        {val == null ? '—' : isPct ? fmtPct(val) : fmtCount(val)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            {t.vsPreviousTerm && (
              <div className="mt-3 pt-3 border-t border-line space-y-1.5 text-xs">
                {Object.entries(t.vsPreviousTerm).map(([key, comp]) => {
                  if (!comp || typeof comp !== 'object') return null
                  const isPct = PCT_METRICS.has(key)
                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-ink/45">{METRIC_LABELS[key] || key}</span>
                      <InlineComparison comparison={comp} isPercentage={isPct} />
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        ))}
      </div>
    </AsyncContent>
  )
}

function MonthlyTrendsTab({ queryParams }) {
  const { data, loading, error } = useFetch(() => analyticsApi.monthlyTrends(queryParams), [JSON.stringify(queryParams)])
  const [active, setActive] = useState(new Set(['attendancePercentage', 'academicAveragePercentage']))
  const months = data?.months ?? []

  const toggle = (key) => {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const chartData = months.map((m) => ({ ...m, label: fmtMonth(m.month) }))

  return (
    <AsyncContent loading={loading} error={error} empty={months.length === 0} emptyState={<p className="text-sm text-ink/50 py-8 text-center">No monthly data available.</p>}>
      <div className="flex flex-wrap gap-2 mb-4">
        {TREND_METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => toggle(m.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              active.has(m.key)
                ? 'border-board/40 bg-board/10 text-board'
                : 'border-line text-ink/45 hover:bg-line/40'
            }`}
          >
            <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: m.color }} />
            {m.label}
          </button>
        ))}
      </div>
      <ChartCard title="Monthly trends">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line, #E5E7EB)" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {TREND_METRICS.filter((m) => active.has(m.key)).map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={m.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </AsyncContent>
  )
}

function ClassComparisonTab({ queryParams }) {
  const { data, loading, error } = useFetch(() => analyticsApi.classComparison(queryParams), [JSON.stringify(queryParams)])
  const classes = data?.classes ?? []

  return (
    <AsyncContent loading={loading} error={error} empty={classes.length === 0} emptyState={<p className="text-sm text-ink/50 py-8 text-center">No class data available.</p>}>
      <Card>
        <Table>
          <THead>
            <Th>Class</Th>
            <Th>Students</Th>
            <Th>Attendance</Th>
            <Th>Academic avg</Th>
            <Th>Pass rate</Th>
            <Th>HW submission</Th>
          </THead>
          <tbody>
            {classes.map((c) => (
              <Tr key={c.className}>
                <Td className="font-semibold text-ink">{c.className}</Td>
                <Td>{fmtCount(c.activeStudents)}</Td>
                <Td><InlineComparison comparison={c.attendancePercentage} isPercentage /></Td>
                <Td><InlineComparison comparison={c.academicAveragePercentage} isPercentage /></Td>
                <Td><InlineComparison comparison={c.passPercentage} isPercentage /></Td>
                <Td>{c.homeworkSubmissionRate != null ? fmtPct(c.homeworkSubmissionRate) : '—'}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </AsyncContent>
  )
}

function SubjectComparisonTab({ queryParams }) {
  const { data, loading, error } = useFetch(() => analyticsApi.subjectComparison(queryParams), [JSON.stringify(queryParams)])
  const subjects = data?.subjects ?? []

  return (
    <AsyncContent loading={loading} error={error} empty={subjects.length === 0} emptyState={<p className="text-sm text-ink/50 py-8 text-center">No subject data available.</p>}>
      <Card>
        <Table>
          <THead>
            <Th>Subject</Th>
            <Th>Graded papers</Th>
            <Th>Average</Th>
            <Th>Pass rate</Th>
          </THead>
          <tbody>
            {subjects.map((s) => (
              <Tr key={s.subjectName}>
                <Td className="font-semibold text-ink">{s.subjectName}</Td>
                <Td>{fmtCount(s.gradedPapers)}</Td>
                <Td><InlineComparison comparison={s.averagePercentage} isPercentage /></Td>
                <Td>
                  <InlineComparison comparison={s.passPercentage} isPercentage />
                  {s.passPercentage?.comparable === false && (
                    <span className="block text-xs text-ink/35 mt-0.5">Not enough data</span>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </AsyncContent>
  )
}

function EngagementTab({ queryParams }) {
  const { data, loading, error } = useFetch(() => analyticsApi.studentEngagement(queryParams), [JSON.stringify(queryParams)])
  const summary = data?.summary
  const byClass = data?.byClass ?? []

  return (
    <AsyncContent loading={loading} error={error} empty={!summary} emptyState={<p className="text-sm text-ink/50 py-8 text-center">No engagement data available.</p>}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Attendance" value={summary?.attendancePercentage} isPercentage />
        <KpiCard label="HW submission rate" value={summary?.homeworkSubmissionRate} isPercentage />
        <KpiCard label="HW completion rate" value={summary?.homeworkCompletionRate} isPercentage />
      </div>

      {byClass.length > 0 && (
        <Card className="mb-6">
          <div className="px-5 pt-4 pb-2">
            <h3 className="font-display font-semibold text-ink">By class</h3>
          </div>
          <Table>
            <THead>
              <Th>Class</Th>
              <Th>Attendance</Th>
              <Th>HW submission</Th>
              <Th>HW completion</Th>
            </THead>
            <tbody>
              {byClass.map((c) => (
                <Tr key={c.classId || c.className}>
                  <Td className="font-semibold text-ink">{c.className}</Td>
                  <Td>{fmtPct(c.attendancePercentage)}</Td>
                  <Td>{fmtPct(c.homeworkSubmissionRate)}</Td>
                  <Td>{fmtPct(c.homeworkCompletionRate)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isNotTracked(data?.classroomParticipation) && <NotTrackedCard title="Classroom participation" reason={data.classroomParticipation.reason} />}
        {isNotTracked(data?.labParticipation) && <NotTrackedCard title="Lab participation" reason={data.labParticipation.reason} />}
        {isNotTracked(data?.activityParticipation) && <NotTrackedCard title="Activity participation" reason={data.activityParticipation.reason} />}
        {isNotTracked(data?.achievements) && <NotTrackedCard title="Achievements" reason={data.achievements.reason} />}
      </div>
    </AsyncContent>
  )
}

function CoCurricularTab({ queryParams }) {
  const { data, loading, error } = useFetch(() => analyticsApi.coCurricular(queryParams), [JSON.stringify(queryParams)])
  const byMonth = data?.byMonth ?? []
  const activities = data?.activities ?? []

  return (
    <AsyncContent loading={loading} error={error} empty={!data} emptyState={<p className="text-sm text-ink/50 py-8 text-center">No co-curricular data available.</p>}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Activities held" value={data?.activitiesHeld} />
      </div>

      {byMonth.length > 0 && (
        <Card className="mb-6">
          <div className="px-5 pt-4 pb-2">
            <h3 className="font-display font-semibold text-ink">Activities by month</h3>
          </div>
          <Table>
            <THead>
              <Th>Month</Th>
              <Th>Activities</Th>
            </THead>
            <tbody>
              {byMonth.map((m) => (
                <Tr key={m.month}>
                  <Td>{fmtMonth(m.month)}</Td>
                  <Td>{fmtCount(m.activities)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {activities.length > 0 && (
        <Card className="mb-6">
          <div className="px-5 pt-4 pb-2">
            <h3 className="font-display font-semibold text-ink">Activities</h3>
          </div>
          <Table>
            <THead>
              <Th>Title</Th>
              <Th>Start</Th>
              <Th>End</Th>
              <Th>Audience</Th>
            </THead>
            <tbody>
              {activities.map((a) => (
                <Tr key={a.id}>
                  <Td className="font-semibold text-ink">{a.title}</Td>
                  <Td>{fmtDay(a.startDate)}</Td>
                  <Td>{fmtDay(a.endDate)}</Td>
                  <Td>{a.audience || '—'}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isNotTracked(data?.categories) && <NotTrackedCard title="Activity categories" reason={data.categories.reason} />}
        {isNotTracked(data?.participation) && <NotTrackedCard title="Participation" reason={data.participation.reason} />}
        {isNotTracked(data?.achievements) && <NotTrackedCard title="Achievements" reason={data.achievements.reason} />}
      </div>
    </AsyncContent>
  )
}

function ParticipationTab({ queryParams }) {
  const { data, loading, error } = useFetch(() => analyticsApi.studentParticipation(queryParams), [JSON.stringify(queryParams)])

  if (loading) return <Card className="p-6"><p className="text-sm text-ink/50">Loading…</p></Card>
  if (error) return <Alert>{error}</Alert>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {data && Object.entries(data).map(([key, val]) => {
        if (isNotTracked(val)) return <NotTrackedCard key={key} title={key.replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase()).trim()} reason={val.reason} />
        return null
      })}
      {data && !Object.values(data).some((v) => isNotTracked(v)) && (
        <NotTrackedCard title="Student participation" reason="Student participation tracking is not yet available." />
      )}
    </div>
  )
}

export default function ComparisonsAnalyticsPage() {
  const [tab, setTab] = useState('year')
  const { filters, setFilter, queryParams } = useAnalyticsFilters()

  const showTeacher = false
  const showSubject = tab === 'subject'

  return (
    <AnalyticsShell title="Comparisons & Engagement">
      <FilterBar
        filters={filters}
        setFilter={setFilter}
        showClass
        showSection
        showSubject={showSubject}
      />

      <Tabs options={TABS} value={tab} onChange={setTab} className="mb-6" />

      {tab === 'year' && <YearComparisonTab queryParams={queryParams} />}
      {tab === 'term' && <TermComparisonTab queryParams={queryParams} />}
      {tab === 'monthly' && <MonthlyTrendsTab queryParams={queryParams} />}
      {tab === 'class' && <ClassComparisonTab queryParams={queryParams} />}
      {tab === 'subject' && <SubjectComparisonTab queryParams={queryParams} />}
      {tab === 'engagement' && <EngagementTab queryParams={queryParams} />}
      {tab === 'cocurricular' && <CoCurricularTab queryParams={queryParams} />}
      {tab === 'participation' && <ParticipationTab queryParams={queryParams} />}
    </AnalyticsShell>
  )
}
