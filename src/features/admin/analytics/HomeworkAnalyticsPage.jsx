import { useState } from 'react'
import { BookOpen, CheckCircle2, ClipboardList, AlertTriangle } from 'lucide-react'
import { Card, AsyncContent, PageLoader, Table, THead, Th, Td, Tr, Tabs, Badge } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { analyticsApi } from './analytics.api.js'
import { useAnalyticsFilters } from './useAnalyticsFilters.js'
import { fmtPct, fmtCount, isNotTracked } from './analytics.helpers.js'
import AnalyticsShell from './components/AnalyticsShell.jsx'
import FilterBar from './components/FilterBar.jsx'
import KpiCard from './components/KpiCard.jsx'
import NotTrackedCard from './components/NotTrackedCard.jsx'

const TAB_OPTIONS = [
  { value: 'overview', label: 'Overview' },
  { value: 'submissions', label: 'Submissions' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'projects', label: 'Projects' },
  { value: 'weekly', label: 'Weekly Tests' },
  { value: 'testPerf', label: 'Test Performance' },
]

function HwKpis({ summary }) {
  if (!summary) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <KpiCard icon={BookOpen} label="Assigned" value={summary.homeworkAssigned} />
      <KpiCard icon={CheckCircle2} label="Submitted" value={summary.submitted} />
      <KpiCard label="Submitted (of checked)" value={summary.submissionRate} isPercentage />
      <KpiCard label="Submitted (of all eligible)" value={summary.completionRate} isPercentage />
      <KpiCard label="Checked by teacher" value={summary.checkingCompletionRate} isPercentage />
    </div>
  )
}

function HwSummaryTable({ title, rows, extraColumns }) {
  if (!rows?.length) return null
  return (
    <Card className="mb-6">
      <div className="px-5 py-4 border-b border-line">
        <h3 className="font-display font-semibold text-ink">{title}</h3>
      </div>
      <Table>
        <THead>
          <Th>{extraColumns?.nameLabel || 'Name'}</Th>
          <Th>Assigned</Th>
          <Th>Submitted</Th>
          <Th>Submitted (of checked)</Th>
          <Th>Submitted (of all eligible)</Th>
          <Th>Checked by teacher</Th>
          {extraColumns?.extra?.map((c) => <Th key={c.key}>{c.label}</Th>)}
        </THead>
        <tbody>
          {rows.map((r, i) => (
            <Tr key={r.id || r.subjectId || r.classId || r.sectionId || r.type || i}>
              <Td className="font-medium text-ink">{r.name || r.subjectName || r.className || r.sectionName || r.type || '—'}</Td>
              <Td>{fmtCount(r.homeworkAssigned)}</Td>
              <Td>{fmtCount(r.submitted)}</Td>
              <Td>{fmtPct(r.submissionRate)}</Td>
              <Td>{fmtPct(r.completionRate)}</Td>
              <Td>{fmtPct(r.checkingCompletionRate)}</Td>
              {extraColumns?.extra?.map((c) => <Td key={c.key}>{c.render ? c.render(r) : fmtCount(r[c.key])}</Td>)}
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

function OverviewTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.homework(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load homework data.' },
  )

  return (
    <AsyncContent loading={loading} error={error} empty={false}>
      {data && (
        <>
          <HwKpis summary={data.summary} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KpiCard label="Not submitted" value={data.summary?.notSubmitted} />
            <KpiCard label="Not checked yet" value={data.summary?.notCheckedYet} />
            <KpiCard icon={AlertTriangle} label="Overdue unchecked" value={data.summary?.overdueUncheckedHomework} />
          </div>

          <HwSummaryTable title="By type" rows={data.byType} extraColumns={{ nameLabel: 'Type' }} />
          <HwSummaryTable title="By subject" rows={data.bySubject} extraColumns={{ nameLabel: 'Subject' }} />
          <HwSummaryTable title="By class" rows={data.byClass} extraColumns={{ nameLabel: 'Class' }} />

          {isNotTracked(data.lateSubmissions) && (
            <NotTrackedCard title="Late submissions" reason={data.lateSubmissions.reason} />
          )}
        </>
      )}
    </AsyncContent>
  )
}

function SubmissionsTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.homeworkSubmissions(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load submission data.' },
  )

  return (
    <AsyncContent loading={loading} error={error} empty={false}>
      {data && (
        <>
          <HwKpis summary={data.summary} />

          <HwSummaryTable title="By section" rows={data.bySection} extraColumns={{ nameLabel: 'Section' }} />

          {data.studentsMostMissing?.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b border-line">
                <h3 className="font-display font-semibold text-ink">Students most missing</h3>
              </div>
              <Table>
                <THead>
                  <Th>Name</Th>
                  <Th>Admission No</Th>
                  <Th>Class</Th>
                  <Th>Section</Th>
                  <Th>Not submitted</Th>
                </THead>
                <tbody>
                  {data.studentsMostMissing.map((s) => (
                    <Tr key={s.studentId}>
                      <Td className="font-medium text-ink">{s.name}</Td>
                      <Td>{s.admissionNo || '—'}</Td>
                      <Td>{s.className || '—'}</Td>
                      <Td>{s.sectionName || '—'}</Td>
                      <Td>
                        <Badge tone="danger">{fmtCount(s.notSubmittedCount)}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </>
      )}
    </AsyncContent>
  )
}

function AssignmentsTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.assignmentCompletion(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load assignment data.' },
  )

  return (
    <AsyncContent loading={loading} error={error} empty={false}>
      {data && (
        <>
          <HwKpis summary={data.summary} />

          {data.assignments && (
            <Card className="p-5 mb-6">
              <h3 className="font-display font-semibold text-ink mb-3">Assignments</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-ink/50">Assigned</p>
                  <p className="font-semibold text-ink">{fmtCount(data.assignments.homeworkAssigned)}</p>
                </div>
                <div>
                  <p className="text-ink/50">Submitted</p>
                  <p className="font-semibold text-ink">{fmtCount(data.assignments.submitted)}</p>
                </div>
                <div>
                  <p className="text-ink/50">Submitted (of checked)</p>
                  <p className="font-semibold text-ink">{fmtPct(data.assignments.submissionRate)}</p>
                </div>
                <div>
                  <p className="text-ink/50">Checked by teacher</p>
                  <p className="font-semibold text-ink">{fmtPct(data.assignments.checkingCompletionRate)}</p>
                </div>
              </div>
            </Card>
          )}

          {data.projects && (
            <Card className="p-5 mb-6">
              <h3 className="font-display font-semibold text-ink mb-3">Projects</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-ink/50">Assigned</p>
                  <p className="font-semibold text-ink">{fmtCount(data.projects.homeworkAssigned)}</p>
                </div>
                <div>
                  <p className="text-ink/50">Submitted</p>
                  <p className="font-semibold text-ink">{fmtCount(data.projects.submitted)}</p>
                </div>
                <div>
                  <p className="text-ink/50">Submitted (of checked)</p>
                  <p className="font-semibold text-ink">{fmtPct(data.projects.submissionRate)}</p>
                </div>
                <div>
                  <p className="text-ink/50">Checked by teacher</p>
                  <p className="font-semibold text-ink">{fmtPct(data.projects.checkingCompletionRate)}</p>
                </div>
              </div>
            </Card>
          )}

          {isNotTracked(data.onTimeRate) && (
            <NotTrackedCard title="On-time rate" reason={data.onTimeRate.reason} />
          )}
        </>
      )}
    </AsyncContent>
  )
}

function ProjectsTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.projectPractical(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load project data.' },
  )

  return (
    <AsyncContent loading={loading} error={error} empty={false}>
      {data && (
        <>
          {data.projects && (
            <Card className="p-5 mb-6">
              <h3 className="font-display font-semibold text-ink mb-3">Projects</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-ink/50">Assigned</p>
                  <p className="font-semibold text-ink">{fmtCount(data.projects.homeworkAssigned)}</p>
                </div>
                <div>
                  <p className="text-ink/50">Submitted</p>
                  <p className="font-semibold text-ink">{fmtCount(data.projects.submitted)}</p>
                </div>
                <div>
                  <p className="text-ink/50">Submitted (of checked)</p>
                  <p className="font-semibold text-ink">{fmtPct(data.projects.submissionRate)}</p>
                </div>
                <div>
                  <p className="text-ink/50">Checked by teacher</p>
                  <p className="font-semibold text-ink">{fmtPct(data.projects.checkingCompletionRate)}</p>
                </div>
              </div>
            </Card>
          )}

          {isNotTracked(data.projectScores) && (
            <NotTrackedCard title="Project scores" reason={data.projectScores.reason} />
          )}
          {isNotTracked(data.practicals) && (
            <div className="mt-4">
              <NotTrackedCard title="Practicals" reason={data.practicals.reason} />
            </div>
          )}
        </>
      )}
    </AsyncContent>
  )
}

function WeeklyTestsTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.weeklyTests(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load weekly test data.' },
  )

  if (loading) return <PageLoader />
  if (error) return <div className="p-6 text-sm text-coral font-medium">{error}</div>
  if (isNotTracked(data)) return <NotTrackedCard title="Weekly tests" reason={data.reason} />

  return (
    <Card className="p-5">
      <p className="text-sm text-ink/50">Weekly test data will appear here once tracking is enabled.</p>
    </Card>
  )
}

function TestPerformanceTab({ queryParams }) {
  const { data, loading, error } = useFetch(
    () => analyticsApi.weeklyTestPerformance(queryParams),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load test performance data.' },
  )

  if (loading) return <PageLoader />
  if (error) return <div className="p-6 text-sm text-coral font-medium">{error}</div>
  if (isNotTracked(data)) return <NotTrackedCard title="Weekly test performance" reason={data.reason} />

  return (
    <Card className="p-5">
      <p className="text-sm text-ink/50">Test performance data will appear here once tracking is enabled.</p>
    </Card>
  )
}

export default function HomeworkAnalyticsPage() {
  const [tab, setTab] = useState('overview')
  const { filters, setFilter, queryParams } = useAnalyticsFilters()
  const { notify } = useToast()

  return (
    <AnalyticsShell title="Homework Analytics">
      <FilterBar
        filters={filters}
        setFilter={setFilter}
        showClass
        showSection
        showSubject
        showTeacher
      />

      <Tabs options={TAB_OPTIONS} value={tab} onChange={setTab} className="mb-6" />

      {tab === 'overview' && <OverviewTab queryParams={queryParams} />}
      {tab === 'submissions' && <SubmissionsTab queryParams={queryParams} />}
      {tab === 'assignments' && <AssignmentsTab queryParams={queryParams} />}
      {tab === 'projects' && <ProjectsTab queryParams={queryParams} />}
      {tab === 'weekly' && <WeeklyTestsTab queryParams={queryParams} />}
      {tab === 'testPerf' && <TestPerformanceTab queryParams={queryParams} />}
    </AnalyticsShell>
  )
}
