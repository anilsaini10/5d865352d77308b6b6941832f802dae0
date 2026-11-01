import { useState } from 'react'
import { Users, GraduationCap, TrendingUp, Building2, ChevronDown } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Line, ComposedChart } from 'recharts'
import { Card, AsyncContent, Table, THead, Th, Td, Tr, Tabs, Badge, Alert } from '../../../components/ui.jsx'
import { DonutChart, ChartCard } from '../dashboard/components/charts.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { analyticsApi } from './analytics.api.js'
import { useAnalyticsFilters } from './useAnalyticsFilters.js'
import AnalyticsShell from './components/AnalyticsShell.jsx'
import FilterBar from './components/FilterBar.jsx'
import KpiCard from './components/KpiCard.jsx'
import NotTrackedCard from './components/NotTrackedCard.jsx'
import TrendStat from './components/TrendStat.jsx'
import { fmtPct, fmtCount, isNotTracked } from './analytics.helpers.js'
import { formatNumber } from '../../../utils/format.js'

const TAB_OPTIONS = [
  { value: 'strength', label: 'Strength' },
  { value: 'trend', label: 'Enrollment Trend' },
  { value: 'gender', label: 'Gender' },
  { value: 'grade', label: 'Grade Distribution' },
  { value: 'growth', label: 'Growth' },
]

function UtilizationBar({ value }) {
  const capped = Math.min(value ?? 0, 120)
  const over = (value ?? 0) > 100
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2.5 rounded-full bg-line/60 overflow-hidden">
        <div
          className={`h-full rounded-full ${over ? 'bg-coral' : 'bg-success'}`}
          style={{ width: `${(capped / 120) * 100}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${over ? 'text-coral' : 'text-ink/60'}`}>
        {fmtPct(value)}
      </span>
    </div>
  )
}

function StrengthTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.studentStrength(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load student strength data.' },
  )
  const [expanded, setExpanded] = useState({})

  const toggle = (classId) => setExpanded((prev) => ({ ...prev, [classId]: !prev[classId] }))

  const summary = data?.summary
  const classes = data?.classes ?? []

  return (
    <AsyncContent loading={loading} error={error} empty={!summary}>
      {summary && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <KpiCard icon={Users} label="Total Students" value={summary.total} />
            <KpiCard icon={Building2} label="Classes" value={summary.classes} />
            <KpiCard label="Sections" value={summary.sections} />
            <KpiCard label="Capacity Utilization" value={summary.utilizationPercentage} isPercentage />
          </div>

          <Card className="overflow-hidden">
            <Table>
              <THead>
                <Th />
                <Th>Class</Th>
                <Th>Students</Th>
                <Th>Male</Th>
                <Th>Female</Th>
                <Th>Other</Th>
                <Th>Sections</Th>
                <Th>Capacity</Th>
                <Th>Utilization</Th>
              </THead>
              <tbody>
                {classes.map((cls) => (
                  <ClassRow
                    key={cls.classId}
                    cls={cls}
                    open={!!expanded[cls.classId]}
                    onToggle={() => toggle(cls.classId)}
                  />
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </AsyncContent>
  )
}

function ClassRow({ cls, open, onToggle }) {
  return (
    <>
      <Tr className="cursor-pointer hover:bg-line/20" onClick={onToggle}>
        <Td>
          <ChevronDown size={14} className={`text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Td>
        <Td className="font-semibold text-ink">{cls.className}</Td>
        <Td>{fmtCount(cls.students)}</Td>
        <Td>{fmtCount(cls.male)}</Td>
        <Td>{fmtCount(cls.female)}</Td>
        <Td>{fmtCount(cls.other)}</Td>
        <Td>{cls.sectionCount}</Td>
        <Td>{cls.capacity != null ? fmtCount(cls.capacity) : '—'}</Td>
        <Td><UtilizationBar value={cls.utilizationPercentage} /></Td>
      </Tr>
      {open && cls.sections?.map((sec) => (
        <Tr key={sec.sectionId} className="bg-line/10">
          <Td />
          <Td className="pl-10 text-ink/60">{sec.sectionName}</Td>
          <Td>{fmtCount(sec.students)}</Td>
          <Td>{fmtCount(sec.male)}</Td>
          <Td>{fmtCount(sec.female)}</Td>
          <Td>{fmtCount(sec.other)}</Td>
          <Td />
          <Td>{sec.capacity != null ? fmtCount(sec.capacity) : '—'}</Td>
          <Td><UtilizationBar value={sec.utilizationPercentage} /></Td>
        </Tr>
      ))}
    </>
  )
}

function EnrollmentTrendTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.enrollmentTrend({ ...queryParams, sessions: 5 }),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load enrollment trend.' },
  )

  const sessions = data?.sessions ?? []
  const chartData = sessions.map((s) => ({
    name: s.inProgress ? `${s.session.label} *` : s.session.label,
    enrollment: s.enrollment,
    newAdmissions: s.newAdmissions,
    growthPercentage: s.growthPercentage,
  }))

  return (
    <AsyncContent loading={loading} error={error} empty={sessions.length === 0}>
      <ChartCard title="Enrollment over sessions" subtitle="Bar = enrollment, Line = growth %">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line, #E5E7EB)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} unit="%" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="enrollment" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Enrollment" />
              <Bar yAxisId="left" dataKey="newAdmissions" fill="#3B82F6" radius={[4, 4, 0, 0]} name="New admissions" />
              <Line yAxisId="right" type="monotone" dataKey="growthPercentage" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} name="Growth %" connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {sessions.some((s) => s.inProgress) && (
          <p className="text-xs text-ink/45 mt-2">* In progress</p>
        )}
      </ChartCard>
    </AsyncContent>
  )
}

function GenderDistributionTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.genderDistribution(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load gender distribution.' },
  )

  const overall = data?.overall
  const byClass = data?.byClass ?? []

  const donutSegments = overall
    ? [
        { key: 'male', label: 'Male', value: overall.male, tone: 'board' },
        { key: 'female', label: 'Female', value: overall.female, tone: 'coral' },
        { key: 'other', label: 'Other', value: overall.other, tone: 'chalk' },
      ]
    : []

  return (
    <AsyncContent loading={loading} error={error} empty={!overall}>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Overall gender split">
          <DonutChart segments={donutSegments} centerLabel="Students" />
        </ChartCard>

        <ChartCard title="Gender by class">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byClass.map((c) => ({ name: c.className ?? c.classId, male: c.male, female: c.female, other: c.other }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line, #E5E7EB)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="male" stackId="g" fill="#4F46E5" name="Male" />
                <Bar dataKey="female" stackId="g" fill="#EF4444" name="Female" />
                <Bar dataKey="other" stackId="g" fill="#F59E0B" name="Other" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </AsyncContent>
  )
}

function GradeDistributionTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.gradeDistribution(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load grade distribution.' },
  )

  const grades = data?.grades ?? []

  return (
    <AsyncContent loading={loading} error={error} empty={grades.length === 0}>
      <Card className="overflow-hidden">
        <Table>
          <THead>
            <Th>Class</Th>
            <Th>Students</Th>
            <Th>Share of school</Th>
            <Th>Capacity</Th>
            <Th>Utilization</Th>
          </THead>
          <tbody>
            {grades.map((g) => (
              <Tr key={g.className}>
                <Td className="font-semibold text-ink">{g.className}</Td>
                <Td>{fmtCount(g.students)}</Td>
                <Td>{fmtPct(g.shareOfSchoolPercentage)}</Td>
                <Td>{g.capacity != null ? fmtCount(g.capacity) : '—'}</Td>
                <Td><UtilizationBar value={g.utilizationPercentage} /></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </AsyncContent>
  )
}

function GrowthTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.studentGrowth(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load student growth data.' },
  )

  const enrollment = data?.enrollment

  return (
    <AsyncContent loading={loading} error={error} empty={!enrollment}>
      {enrollment && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard icon={GraduationCap} label="Current enrollment" value={enrollment.currentEnrollment} />
            <KpiCard label="Previous enrollment" value={enrollment.previousEnrollment} />
            <KpiCard icon={TrendingUp} label="Growth" value={enrollment.growthPercentage} isPercentage hint={`Net change: ${enrollment.netEnrollmentChange >= 0 ? '+' : ''}${formatNumber(enrollment.netEnrollmentChange)}`} />
            <KpiCard label="Retention rate" value={enrollment.retentionRate} isPercentage />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <KpiCard label="New admissions" value={enrollment.newAdmissions} />
            <KpiCard label="Exited since previous period" value={enrollment.exitedSincePreviousPeriod} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isNotTracked(enrollment.transfers)
              ? <NotTrackedCard title="Transfers" reason={enrollment.transfers.reason} />
              : <KpiCard label="Transfers" value={enrollment.transfers} />}
            {isNotTracked(enrollment.withdrawals)
              ? <NotTrackedCard title="Withdrawals" reason={enrollment.withdrawals.reason} />
              : <KpiCard label="Withdrawals" value={enrollment.withdrawals} />}
          </div>
        </>
      )}
    </AsyncContent>
  )
}

export default function StudentsAnalyticsPage() {
  const [tab, setTab] = useState('strength')
  const { filters, setFilter, queryParams } = useAnalyticsFilters(['year', 'startDate', 'endDate', 'classId', 'sectionId'])
  const { notify } = useToast()

  const strengthFetch = useFetch(
    () => analyticsApi.studentStrength(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load data.', enabled: tab === 'strength' },
  )

  const meta = strengthFetch.data?.meta ?? null

  return (
    <AnalyticsShell title="Students & Enrollment" meta={meta}>
      <FilterBar filters={filters} setFilter={setFilter} showClass showSection />
      <Tabs options={TAB_OPTIONS} value={tab} onChange={setTab} className="mb-6" />

      {tab === 'strength' && <StrengthTab queryParams={queryParams} />}
      {tab === 'trend' && <EnrollmentTrendTab queryParams={queryParams} />}
      {tab === 'gender' && <GenderDistributionTab queryParams={queryParams} />}
      {tab === 'grade' && <GradeDistributionTab queryParams={queryParams} />}
      {tab === 'growth' && <GrowthTab queryParams={queryParams} />}
    </AnalyticsShell>
  )
}
