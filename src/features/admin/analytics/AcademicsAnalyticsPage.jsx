import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid } from 'recharts'
import { BookOpen, AlertTriangle, TrendingUp, TrendingDown, Minus, Info, Users, FileText, Award } from 'lucide-react'
import { analyticsApi } from './analytics.api.js'
import { useAnalyticsFilters } from './useAnalyticsFilters.js'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import AnalyticsShell from './components/AnalyticsShell.jsx'
import FilterBar from './components/FilterBar.jsx'
import KpiCard from './components/KpiCard.jsx'
import NotTrackedCard from './components/NotTrackedCard.jsx'
import TrendStat from './components/TrendStat.jsx'
import PaperStatsBar from './components/PaperStatsBar.jsx'
import Pagination from '../../../components/Pagination.jsx'
import { Card, AsyncContent, PageLoader, Table, THead, Th, Td, Tr, Tabs, Badge, Alert, Button } from '../../../components/ui.jsx'
import { ChartCard } from '../dashboard/components/charts.jsx'
import { fmtPct, fmtCount, isNotTracked, fmtDay } from './analytics.helpers.js'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'

const TAB_OPTIONS = [
  { value: 'performance', label: 'Performance' },
  { value: 'pass-fail', label: 'Pass / Fail' },
  { value: 'subjects', label: 'Subjects' },
  { value: 'classes', label: 'Classes' },
  { value: 'exams', label: 'Exams' },
  { value: 'top', label: 'Top Performers' },
  { value: 'support', label: 'Needs Support' },
  { value: 'growth', label: 'Growth' },
]

const TREND_ARROWS = {
  UP: { icon: TrendingUp, color: 'text-success' },
  DOWN: { icon: TrendingDown, color: 'text-coral' },
  FLAT: { icon: Minus, color: 'text-ink/40' },
  UNKNOWN: { icon: Minus, color: 'text-ink/40' },
}

const REASON_TONES = {
  LOW_AVERAGE: 'warning',
  FAILED_PAPERS: 'danger',
  LOW_ATTENDANCE: 'info',
}
const REASON_LABELS = {
  LOW_AVERAGE: 'Low average',
  FAILED_PAPERS: 'Failed papers',
  LOW_ATTENDANCE: 'Low attendance',
}

export default function AcademicsAnalyticsPage() {
  const [tab, setTab] = useState('performance')
  const { filters, setFilter, queryParams } = useAnalyticsFilters()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [supportPage, setSupportPage] = useState(1)

  const handleError = (err) => {
    const code = getErrorCode(err)
    if (code === 'CLASS_NOT_FOUND') { setFilter('classId', ''); notify('Class not found.', 'error') }
    else if (code === 'SECTION_NOT_FOUND') { setFilter('sectionId', ''); notify('Section not found.', 'error') }
    else if (code === 'SUBJECT_NOT_FOUND') { setFilter('subjectId', ''); notify('Subject not found.', 'error') }
    else if (code === 'TEACHER_NOT_FOUND') { setFilter('teacherId', ''); notify('Teacher not found.', 'error') }
    else if (code === 'EXAM_NOT_FOUND') { setFilter('examId', ''); notify('Exam not found.', 'error') }
  }

  const perf = useFetch(() => analyticsApi.academicPerformance(queryParams).catch((e) => { handleError(e); throw e }), [tab, JSON.stringify(queryParams)], { enabled: tab === 'performance' })
  const pf = useFetch(() => analyticsApi.passFail(queryParams).catch((e) => { handleError(e); throw e }), [tab, JSON.stringify(queryParams)], { enabled: tab === 'pass-fail' })
  const subj = useFetch(() => analyticsApi.subjectPerformance(queryParams).catch((e) => { handleError(e); throw e }), [tab, JSON.stringify(queryParams)], { enabled: tab === 'subjects' })
  const cls = useFetch(() => analyticsApi.classPerformance(queryParams).catch((e) => { handleError(e); throw e }), [tab, JSON.stringify(queryParams)], { enabled: tab === 'classes' })
  const exam = useFetch(() => analyticsApi.examPerformance(queryParams).catch((e) => { handleError(e); throw e }), [tab, JSON.stringify(queryParams)], { enabled: tab === 'exams' })
  const top = useFetch(() => analyticsApi.topPerformers({ ...queryParams, limit: 10, minPapers: 1 }).catch((e) => { handleError(e); throw e }), [tab, JSON.stringify(queryParams)], { enabled: tab === 'top' })
  const support = useFetch(() => analyticsApi.needsSupport({ ...queryParams, threshold: 40, attendanceThreshold: 75, page: supportPage, pageSize: 20 }).catch((e) => { handleError(e); throw e }), [tab, JSON.stringify(queryParams), supportPage], { enabled: tab === 'support' })
  const growth = useFetch(() => analyticsApi.academicGrowth(queryParams).catch((e) => { handleError(e); throw e }), [tab, JSON.stringify(queryParams)], { enabled: tab === 'growth' })

  const meta = perf.data?.meta || pf.data?.meta || subj.data?.meta || cls.data?.meta || exam.data?.meta || top.data?.meta || support.data?.meta || growth.data?.meta
  const validationError = [perf, pf, subj, cls, exam, top, support, growth].find((f) => f.error && f.error.includes('VALIDATION'))?.error

  return (
    <AnalyticsShell title="Academics" meta={meta}>
      <FilterBar
        filters={filters}
        setFilter={setFilter}
        showClass showSection showSubject showTeacher showExam showPassPercentage
      />
      {validationError && <Alert tone="error" className="mb-4">{validationError}</Alert>}

      <Tabs options={TAB_OPTIONS} value={tab} onChange={(v) => { setTab(v); setSupportPage(1) }} className="mb-6" />

      {tab === 'performance' && <PerformanceTab data={perf.data} loading={perf.loading} error={perf.error} />}
      {tab === 'pass-fail' && <PassFailTab data={pf.data} loading={pf.loading} error={pf.error} />}
      {tab === 'subjects' && <SubjectsTab data={subj.data} loading={subj.loading} error={subj.error} />}
      {tab === 'classes' && <ClassesTab data={cls.data} loading={cls.loading} error={cls.error} />}
      {tab === 'exams' && <ExamsTab data={exam.data} loading={exam.loading} error={exam.error} />}
      {tab === 'top' && <TopPerformersTab data={top.data} loading={top.loading} error={top.error} />}
      {tab === 'support' && <NeedsSupportTab data={support.data} loading={support.loading} error={support.error} page={supportPage} onPageChange={setSupportPage} navigate={navigate} />}
      {tab === 'growth' && <GrowthTab data={growth.data} loading={growth.loading} error={growth.error} />}
    </AnalyticsShell>
  )
}

/* ─── Performance ──────────────────────────────────────────────────── */

function PerformanceTab({ data, loading, error }) {
  if (loading) return <PageLoader />
  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="text-sm text-ink/50 py-8 text-center">No data for this period.</p>

  const d = data
  const summary = d.summary
  const outcomes = d.studentExamOutcomes
  const grades = d.gradeDistribution

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard icon={FileText} label="Papers" value={summary?.papers} />
        <KpiCard icon={FileText} label="Graded" value={summary?.gradedPapers} />
        <KpiCard icon={Users} label="Assessed students" value={summary?.assessedStudents} />
        <KpiCard icon={BookOpen} label="Average" value={summary?.averagePercentage} isPercentage />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">Student exam outcomes</h3>
          <PaperStatsBar data={outcomes} />
        </Card>

        {summary?.missingMarkEntries > 0 && (
          <Card className="p-5">
            <h3 className="font-display font-semibold text-ink mb-2">Missing marks</h3>
            <p className="text-sm text-ink/60">{fmtCount(summary.missingMarkEntries)} mark entries missing across {fmtCount(summary.papersWithMissingEntries)} papers.</p>
          </Card>
        )}
      </div>

      {grades && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">Grade distribution</h3>
          {grades.bands?.length > 0 && (
            <Table>
              <THead><Th>Band</Th><Th>Students</Th><Th>Percentage</Th></THead>
              <tbody>
                {grades.bands.map((b) => (
                  <Tr key={b.band}><Td>{b.band}</Td><Td>{fmtCount(b.students)}</Td><Td>{fmtPct(b.percentage)}</Td></Tr>
                ))}
              </tbody>
            </Table>
          )}
          {grades.enteredGrades?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-ink/50 mb-2">Entered grades</p>
              <div className="flex flex-wrap gap-2">
                {grades.enteredGrades.map((g) => (
                  <span key={g.grade} className="inline-flex items-center gap-1 rounded-full bg-board/10 text-board px-2.5 py-1 text-xs font-semibold">
                    {g.grade}: {fmtCount(g.papers)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {d.bySubject?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">By subject</h3>
          <Table>
            <THead><Th>Subject</Th><Th>Papers</Th><Th>Average</Th><Th>Pass %</Th><Th>Fail</Th><Th>Absent</Th></THead>
            <tbody>
              {d.bySubject.map((s) => (
                <Tr key={s.subjectName}><Td className="font-medium text-ink">{s.subjectName}</Td><Td>{fmtCount(s.gradedPapers)}</Td><Td>{fmtPct(s.averagePercentage)}</Td><Td>{fmtPct(s.passPercentage)}</Td><Td>{fmtCount(s.failCount)}</Td><Td>{fmtCount(s.absentCount)}</Td></Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {d.byClass?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">By class</h3>
          <Table>
            <THead><Th>Class</Th><Th>Papers</Th><Th>Average</Th><Th>Pass %</Th><Th>Fail</Th><Th>Absent</Th></THead>
            <tbody>
              {d.byClass.map((c) => (
                <Tr key={c.className}><Td className="font-medium text-ink">{c.className}</Td><Td>{fmtCount(c.gradedPapers)}</Td><Td>{fmtPct(c.averagePercentage)}</Td><Td>{fmtPct(c.passPercentage)}</Td><Td>{fmtCount(c.failCount)}</Td><Td>{fmtCount(c.absentCount)}</Td></Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isNotTracked(d.componentMarks) && <NotTrackedCard title="Component marks" reason={d.componentMarks.reason} />}
        {isNotTracked(d.eligibility) && <NotTrackedCard title="Eligibility" reason={d.eligibility.reason} />}
      </div>
    </div>
  )
}

/* ─── Pass / Fail ──────────────────────────────────────────────────── */

function PassFailTab({ data, loading, error }) {
  if (loading) return <PageLoader />
  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="text-sm text-ink/50 py-8 text-center">No data for this period.</p>

  const d = data
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display font-semibold text-ink">Student × Exam</h3>
            <span className="group relative">
              <Info size={14} className="text-ink/30 cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-ink text-paper text-xs rounded-lg px-3 py-2 w-56 shadow-pop z-10">
                Each row is one student in one exam. A student who took 3 exams counts 3 times.
              </span>
            </span>
          </div>
          <PaperStatsBar data={d.studentExams} />
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display font-semibold text-ink">Student × Paper</h3>
            <span className="group relative">
              <Info size={14} className="text-ink/30 cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-ink text-paper text-xs rounded-lg px-3 py-2 w-56 shadow-pop z-10">
                Each row is one student in one paper (subject). A student who took 5 papers counts 5 times.
              </span>
            </span>
          </div>
          <PaperStatsBar data={d.papers} />
          {d.papers?.missingMarkEntries > 0 && (
            <p className="text-xs text-chalk-ink mt-2">{fmtCount(d.papers.missingMarkEntries)} marks not yet entered.</p>
          )}
        </Card>
      </div>

      {d.byClass?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">By class</h3>
          <Table>
            <THead><Th>Class</Th><Th>Pass</Th><Th>Fail</Th><Th>Absent</Th><Th>Pending</Th><Th>Pass %</Th></THead>
            <tbody>
              {d.byClass.map((c, i) => (
                <Tr key={i}><Td className="font-medium text-ink">{c.className}</Td><Td>{fmtCount(c.passCount)}</Td><Td>{fmtCount(c.failCount)}</Td><Td className="text-ink/40">{fmtCount(c.absentCount)}</Td><Td className="text-chalk-ink">{fmtCount(c.pendingCount)}</Td><Td>{fmtPct(c.passPercentage)}</Td></Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {d.bySection?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">By section</h3>
          <Table>
            <THead><Th>Section</Th><Th>Pass</Th><Th>Fail</Th><Th>Absent</Th><Th>Pending</Th><Th>Pass %</Th></THead>
            <tbody>
              {d.bySection.map((s, i) => (
                <Tr key={i}><Td className="font-medium text-ink">{s.sectionName || s.className}</Td><Td>{fmtCount(s.passCount)}</Td><Td>{fmtCount(s.failCount)}</Td><Td className="text-ink/40">{fmtCount(s.absentCount)}</Td><Td className="text-chalk-ink">{fmtCount(s.pendingCount)}</Td><Td>{fmtPct(s.passPercentage)}</Td></Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}

/* ─── Subject Performance ──────────────────────────────────────────── */

function SubjectsTab({ data, loading, error }) {
  if (loading) return <PageLoader />
  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="text-sm text-ink/50 py-8 text-center">No data for this period.</p>

  const d = data
  return (
    <div className="space-y-6">
      {d.overallAveragePercentage != null && (
        <KpiCard icon={BookOpen} label="School average" value={d.overallAveragePercentage} isPercentage className="max-w-xs" />
      )}

      {d.subjects?.length > 0 ? (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">Subject performance</h3>
          <Table>
            <THead><Th>Subject</Th><Th>Papers</Th><Th>Average</Th><Th>Pass %</Th><Th>Gap vs school</Th><Th>Status</Th></THead>
            <tbody>
              {d.subjects.map((s) => (
                <Tr key={s.subjectName}>
                  <Td className="font-medium text-ink">{s.subjectName}</Td>
                  <Td>{fmtCount(s.gradedPapers)}</Td>
                  <Td>{fmtPct(s.averagePercentage)}</Td>
                  <Td>{fmtPct(s.passPercentage)}</Td>
                  <Td>{s.gapVsOverallAverage != null ? `${s.gapVsOverallAverage > 0 ? '+' : ''}${s.gapVsOverallAverage.toFixed(1)}` : '—'}</Td>
                  <Td>
                    {s.learningGap && (
                      <div>
                        <Badge tone="danger">Learning gap</Badge>
                        {s.learningGapReasons?.length > 0 && (
                          <p className="text-xs text-ink/45 mt-1">{s.learningGapReasons.join(', ')}</p>
                        )}
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <p className="text-sm text-ink/50 py-8 text-center">No subject data for this period.</p>
      )}
    </div>
  )
}

/* ─── Class Performance ────────────────────────────────────────────── */

function ClassesTab({ data, loading, error }) {
  if (loading) return <PageLoader />
  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="text-sm text-ink/50 py-8 text-center">No data for this period.</p>

  const d = data
  return (
    <div className="space-y-6">
      {d.bestPerforming?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink/50 mb-2">Best performing</p>
          <div className="flex flex-wrap gap-2">
            {d.bestPerforming.map((b) => (
              <span key={b.className || b.sectionName} className="inline-flex items-center gap-1.5 rounded-full bg-success/10 text-success border border-success/25 px-2.5 py-1 text-xs font-semibold">
                <Award size={12} /> {b.className || b.sectionName} — {fmtPct(b.averagePercentage)}
              </span>
            ))}
          </div>
        </div>
      )}

      {d.classes?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">Class performance</h3>
          <Table>
            <THead><Th>Rank</Th><Th>Class</Th><Th>Papers</Th><Th>Average</Th><Th>Pass %</Th><Th>Fail</Th><Th>Absent</Th></THead>
            <tbody>
              {d.classes.map((c) => (
                <Tr key={c.className}>
                  <Td className="font-semibold text-ink">{c.rank ?? '—'}</Td>
                  <Td className="font-medium text-ink">{c.className}</Td>
                  <Td>{fmtCount(c.gradedPapers)}</Td>
                  <Td>{fmtPct(c.averagePercentage)}</Td>
                  <Td>{fmtPct(c.passPercentage)}</Td>
                  <Td>{fmtCount(c.failCount)}</Td>
                  <Td className="text-ink/40">{fmtCount(c.absentCount)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {d.sections?.length > 0 && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">Section performance</h3>
          <Table>
            <THead><Th>Section</Th><Th>Papers</Th><Th>Average</Th><Th>Pass %</Th><Th>Fail</Th><Th>Absent</Th></THead>
            <tbody>
              {d.sections.map((s, i) => (
                <Tr key={i}>
                  <Td className="font-medium text-ink">{s.sectionName || s.className}</Td>
                  <Td>{fmtCount(s.gradedPapers)}</Td>
                  <Td>{fmtPct(s.averagePercentage)}</Td>
                  <Td>{fmtPct(s.passPercentage)}</Td>
                  <Td>{fmtCount(s.failCount)}</Td>
                  <Td className="text-ink/40">{fmtCount(s.absentCount)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}

/* ─── Exam Performance ─────────────────────────────────────────────── */

function InlineComparison({ comparison }) {
  if (!comparison) return <span className="text-ink/40">—</span>
  const arrow = TREND_ARROWS[comparison.trendDirection] || TREND_ARROWS.UNKNOWN
  const ArrowIcon = arrow.icon
  const change = comparison.percentagePointChange != null
    ? `${comparison.percentagePointChange > 0 ? '+' : ''}${comparison.percentagePointChange.toFixed(1)} pts`
    : null
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <ArrowIcon size={12} className={arrow.color} />
      {change && <span className={arrow.color}>{change}</span>}
    </span>
  )
}

function ExamsTab({ data, loading, error }) {
  if (loading) return <PageLoader />
  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="text-sm text-ink/50 py-8 text-center">No data for this period.</p>

  const exams = data.exams ?? []
  return (
    <div className="space-y-6">
      {exams.length > 0 ? (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">Exam performance</h3>
          <Table>
            <THead><Th>Exam</Th><Th>Papers</Th><Th>Dates</Th><Th>Average</Th><Th>Avg trend</Th><Th>Pass %</Th><Th>Pass trend</Th></THead>
            <tbody>
              {exams.map((e) => (
                <Tr key={e.examId}>
                  <Td className="font-medium text-ink">{e.examTitle}</Td>
                  <Td>{fmtCount(e.scheduledPapers ?? e.gradedPapers)}</Td>
                  <Td className="text-xs text-ink/45 whitespace-nowrap">{e.firstPaperDate ? `${fmtDay(e.firstPaperDate)} – ${fmtDay(e.lastPaperDate)}` : '—'}</Td>
                  <Td>{fmtPct(e.averagePercentage)}</Td>
                  <Td><InlineComparison comparison={e.vsPreviousExam?.average} /></Td>
                  <Td>{fmtPct(e.passPercentage)}</Td>
                  <Td><InlineComparison comparison={e.vsPreviousExam?.passPercentage} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <p className="text-sm text-ink/50 py-8 text-center">No exam data for this period.</p>
      )}
    </div>
  )
}

/* ─── Top Performers ───────────────────────────────────────────────── */

function TopPerformersTab({ data, loading, error }) {
  if (loading) return <PageLoader />
  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="text-sm text-ink/50 py-8 text-center">No data for this period.</p>

  const students = data.students ?? []
  return (
    <div className="space-y-6">
      {students.length > 0 ? (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">Top performers</h3>
          <Table>
            <THead><Th>Rank</Th><Th>Student</Th><Th>Class</Th><Th>Section</Th><Th>Average</Th><Th>Highest</Th><Th>Papers</Th></THead>
            <tbody>
              {students.map((s) => (
                <Tr key={s.studentId}>
                  <Td className="font-semibold text-ink">{s.rank}</Td>
                  <Td className="font-medium text-ink">{s.name}</Td>
                  <Td>{s.className}</Td>
                  <Td>{s.sectionName}</Td>
                  <Td>{fmtPct(s.averagePercentage)}</Td>
                  <Td>{fmtPct(s.highestPercentage)}</Td>
                  <Td>{fmtCount(s.gradedPapers)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <p className="text-sm text-ink/50 py-8 text-center">No performers data available.</p>
      )}
    </div>
  )
}

/* ─── Needs Support ────────────────────────────────────────────────── */

function NeedsSupportTab({ data, loading, error, page, onPageChange, navigate }) {
  if (loading) return <PageLoader />
  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="text-sm text-ink/50 py-8 text-center">No data for this period.</p>

  const summary = data.summary
  const items = data.items ?? []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard icon={AlertTriangle} label="Students at risk" value={summary?.students} />
        <KpiCard icon={BookOpen} label="Low average" value={summary?.lowAverage} />
        <KpiCard icon={FileText} label="Failed papers" value={summary?.failedPapers} />
        <KpiCard icon={Users} label="Also low attendance" value={summary?.alsoLowAttendance} />
      </div>

      {items.length > 0 ? (
        <Card className="p-5">
          <Table>
            <THead><Th>Student</Th><Th>Class</Th><Th>Average</Th><Th>Attendance</Th><Th>Failed papers</Th><Th>Failed subjects</Th><Th>Reasons</Th><Th></Th></THead>
            <tbody>
              {items.map((s) => (
                <Tr key={s.studentId}>
                  <Td className="font-medium text-ink">{s.name}</Td>
                  <Td>{s.className} {s.sectionName}</Td>
                  <Td>{fmtPct(s.averagePercentage)}</Td>
                  <Td>{fmtPct(s.attendancePercentage)}</Td>
                  <Td>{fmtCount(s.failedPapers)}</Td>
                  <Td>{s.failedSubjects?.map((sub) => sub.subjectName).join(', ') || '—'}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {s.reasons?.map((r) => (
                        <Badge key={r} tone={REASON_TONES[r] || 'neutral'}>{REASON_LABELS[r] || r}</Badge>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <Button size="sm" variant="ghost" onClick={() => navigate('/analytics/alerts')}>
                      Intervene
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={onPageChange} />
        </Card>
      ) : (
        <p className="text-sm text-ink/50 py-8 text-center">No students needing support found.</p>
      )}
    </div>
  )
}

/* ─── Growth ───────────────────────────────────────────────────────── */

function GrowthTab({ data, loading, error }) {
  if (loading) return <PageLoader />
  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="text-sm text-ink/50 py-8 text-center">No data for this period.</p>

  const d = data
  const examTrend = d.examTrend ?? []
  const progress = d.studentProgress
  const yoy = d.yearOnYear

  return (
    <div className="space-y-6">
      {examTrend.length > 0 && (
        <ChartCard title="Average percentage by exam" subtitle="Trend across exams in this period">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={examTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line, #E5E7EB)" />
              <XAxis dataKey="examTitle" tick={{ fontSize: 11, fill: 'var(--color-ink, #111827)', opacity: 0.5 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-ink, #111827)', opacity: 0.5 }} />
              <ReTooltip
                contentStyle={{ backgroundColor: 'var(--color-surface, #fff)', border: '1px solid var(--color-line, #E5E7EB)', borderRadius: 12, fontSize: 13 }}
                formatter={(v) => [v != null ? `${v.toFixed(1)}%` : '—', 'Average']}
              />
              <Line type="monotone" dataKey="averagePercentage" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4, fill: '#4F46E5' }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {progress && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">Student progress</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-ink/50">Compared</p>
              <p className="text-lg font-semibold text-ink">{fmtCount(progress.comparedStudents)}</p>
            </div>
            <div>
              <p className="text-xs text-ink/50">Improved</p>
              <p className="text-lg font-semibold text-success">{fmtCount(progress.improved)}</p>
            </div>
            <div>
              <p className="text-xs text-ink/50">Declined</p>
              <p className="text-lg font-semibold text-coral">{fmtCount(progress.declined)}</p>
            </div>
            <div>
              <p className="text-xs text-ink/50">Stable</p>
              <p className="text-lg font-semibold text-ink">{fmtCount(progress.stable)}</p>
            </div>
          </div>
          {progress.averageChangePoints != null && (
            <p className="text-sm text-ink/55 mt-3">Average change: <span className="font-semibold text-ink">{progress.averageChangePoints > 0 ? '+' : ''}{progress.averageChangePoints.toFixed(1)} pts</span></p>
          )}
        </Card>
      )}

      {yoy && (
        <div>
          <h3 className="font-display font-semibold text-ink mb-3">Year-on-year comparison</h3>
          {yoy.truncatedToElapsed && (
            <p className="text-xs text-ink/45 mb-3">Compared with the same point last session ({fmtDay(yoy.currentPeriod?.startDate)} – {fmtDay(yoy.currentPeriod?.endDate)})</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TrendStat label="Average percentage" comparison={yoy.averagePercentage} isPercentage />
            <TrendStat label="Pass percentage" comparison={yoy.passPercentage} isPercentage />
          </div>
        </div>
      )}
    </div>
  )
}
