import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { AsyncContent, Card, EmptyState, Table, THead, Th, Tr, Td, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useClasses } from '../classes/useClasses.js'
import { subjectsApi } from '../subjects/subjects.api.js'
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
      <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-ink/60 w-10 text-right">{pct}%</span>
    </div>
  )
}

export default function ClassProgressPage() {
  const navigate = useNavigate()
  const [sessionYear, setSessionYear] = useState(currentSessionYear())
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const { classes } = useClasses()
  const { data: subjects } = useFetch(() => subjectsApi.list(), [], { errorMessage: 'Could not load subjects.' })

  const { data, loading, error } = useFetch(
    () => syllabusMonitorApi.classProgress({ sessionYear, classId: classId || undefined, subjectId: subjectId || undefined }),
    [sessionYear, classId, subjectId],
    { enabled: !!sessionYear, errorMessage: 'Could not load class progress.' }
  )

  return (
    <AppShell title="Class-wise Progress" subtitle={`Session ${sessionYearLabel(sessionYear)}`} onBack={() => navigate('/syllabus')}>
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
      </div>

      <AsyncContent
        loading={loading}
        error={error}
        empty={data && data.length === 0}
        emptyState={<EmptyState icon={BarChart3} title="No data" message="No syllabus plans found for the selected filters." />}
      >
        <div className="space-y-4">
          {(data ?? []).map((group) => (
            <Card key={group.class.id} className="overflow-hidden">
              <div className="px-5 py-3 border-b border-line bg-surface">
                <h3 className="font-display font-semibold text-ink">{group.class.name}</h3>
              </div>
              <Table>
                <THead>
                  <Th>Section</Th>
                  <Th>Subject</Th>
                  <Th>Chapters</Th>
                  <Th className="w-40">Avg Completion</Th>
                  <Th>Completed</Th>
                  <Th>Delayed</Th>
                </THead>
                <tbody>
                  {group.sections.map((s, i) => (
                    <Tr key={i}>
                      <Td className="font-semibold text-ink">{s.section.name}</Td>
                      <Td>{s.subject.name}</Td>
                      <Td>{s.totalChapters}</Td>
                      <Td><ProgressBar value={s.avgCompletion} /></Td>
                      <Td className="text-success font-semibold">{s.completed}</Td>
                      <Td className={s.delayed > 0 ? 'text-coral font-semibold' : ''}>{s.delayed}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ))}
        </div>
      </AsyncContent>
    </AppShell>
  )
}
