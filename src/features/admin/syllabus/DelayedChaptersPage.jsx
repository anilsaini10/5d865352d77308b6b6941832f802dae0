import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { AsyncContent, Card, EmptyState, Table, THead, Th, Tr, Td, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useClasses } from '../classes/useClasses.js'
import { subjectsApi } from '../subjects/subjects.api.js'
import { teachersApi } from '../teachers/teachers.api.js'
import { syllabusMonitorApi } from './syllabus.api.js'
import { currentSessionYear, sessionYearLabel } from './syllabus.constants.js'

const yearOptions = () => {
  const cur = currentSessionYear()
  return Array.from({ length: 4 }, (_, i) => cur - 2 + i)
}

function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, value ?? 0))
  const color = pct >= 75 ? 'bg-success' : pct >= 40 ? 'bg-chalk' : 'bg-coral'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-line rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-ink/60 whitespace-nowrap">{pct}%</span>
    </div>
  )
}

function varianceClass(v) {
  if (v > 10) return 'text-coral font-bold'
  if (v > 5) return 'text-chalk-ink font-semibold'
  return 'text-ink/70'
}

export default function DelayedChaptersPage() {
  const navigate = useNavigate()
  const [sessionYear, setSessionYear] = useState(currentSessionYear())
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')

  const { classes } = useClasses()
  const { data: subjects } = useFetch(() => subjectsApi.list(), [], { errorMessage: 'Could not load subjects.' })
  const { data: allTeachers } = useFetch(() => teachersApi.listAll(), [], { errorMessage: 'Could not load teachers.' })

  const { data, loading, error } = useFetch(
    () => syllabusMonitorApi.delayedChapters({
      sessionYear,
      classId: classId || undefined,
      subjectId: subjectId || undefined,
      teacherId: teacherId || undefined,
    }),
    [sessionYear, classId, subjectId, teacherId],
    { enabled: !!sessionYear, errorMessage: 'Could not load delayed chapters.' }
  )

  return (
    <AppShell title="Delayed Chapters" subtitle={`Session ${sessionYearLabel(sessionYear)}`} onBack={() => navigate('/syllabus')}>
      <div className="flex flex-wrap gap-3 mb-6">
        <select className={`${selectClass} sm:w-44`} value={sessionYear} onChange={(e) => setSessionYear(Number(e.target.value))}>
          {yearOptions().map((y) => <option key={y} value={y}>{sessionYearLabel(y)}</option>)}
        </select>
        <select className={`${selectClass} sm:w-48`} value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">All classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={`${selectClass} sm:w-48`} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">All subjects</option>
          {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={`${selectClass} sm:w-52`} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
          <option value="">All teachers</option>
          {(allTeachers ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading}
          error={error}
          empty={data && data.length === 0}
          emptyState={<EmptyState icon={AlertTriangle} title="No delayed chapters" message="All chapters are on track for the selected filters." />}
        >
          <Table>
            <THead>
              <Th>Chapter</Th>
              <Th>Class / Section</Th>
              <Th>Subject</Th>
              <Th>Teacher</Th>
              <Th>Expected</Th>
              <Th>Actual</Th>
              <Th>Variance</Th>
              <Th className="w-32">Completion</Th>
              <Th />
            </THead>
            <tbody>
              {(data ?? []).map((row) => (
                <Tr key={row.id}>
                  <Td className="font-semibold text-ink whitespace-nowrap">
                    Ch. {row.chapter.chapterNumber}: {row.chapter.name}
                  </Td>
                  <Td className="whitespace-nowrap">{row.plan.class.name} / {row.plan.section.name}</Td>
                  <Td>{row.plan.subject.name}</Td>
                  <Td>{row.plan.teacher?.user?.name ?? '—'}</Td>
                  <Td>{row.expectedWorkingDays}d</Td>
                  <Td>{row.actualWorkingDays}d</Td>
                  <Td className={varianceClass(row.variance)}>+{row.variance}d</Td>
                  <Td><ProgressBar value={row.completionPercentage} /></Td>
                  <Td>
                    <Link
                      to={`/syllabus/plans/${row.plan.id}`}
                      className="text-board hover:text-board-light transition-colors"
                      title="View plan"
                    >
                      <ExternalLink size={15} />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>
    </AppShell>
  )
}
