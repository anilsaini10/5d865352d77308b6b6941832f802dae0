import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { AsyncContent, Card, EmptyState, Table, THead, Th, Tr, Td, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
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
      <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-ink/60 w-10 text-right">{pct}%</span>
    </div>
  )
}

export default function TeacherProgressPage() {
  const navigate = useNavigate()
  const [sessionYear, setSessionYear] = useState(currentSessionYear())
  const [teacherId, setTeacherId] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const { data: allTeachers } = useFetch(() => teachersApi.listAll(), [], { errorMessage: 'Could not load teachers.' })
  const { data: subjects } = useFetch(() => subjectsApi.list(), [], { errorMessage: 'Could not load subjects.' })

  const { data, loading, error } = useFetch(
    () => syllabusMonitorApi.teacherProgress({ sessionYear, teacherId: teacherId || undefined, subjectId: subjectId || undefined }),
    [sessionYear, teacherId, subjectId],
    { enabled: !!sessionYear, errorMessage: 'Could not load teacher progress.' }
  )

  return (
    <AppShell title="Teacher-wise Progress" subtitle={`Session ${sessionYearLabel(sessionYear)}`} onBack={() => navigate('/syllabus')}>
      <div className="flex flex-wrap gap-3 mb-6">
        <select className={`${selectClass} sm:w-44`} value={sessionYear} onChange={(e) => setSessionYear(Number(e.target.value))}>
          {yearOptions().map((y) => <option key={y} value={y}>{sessionYearLabel(y)}</option>)}
        </select>
        <select className={`${selectClass} sm:w-52`} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
          <option value="">All teachers</option>
          {(allTeachers ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
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
        emptyState={<EmptyState icon={Users} title="No data" message="No teacher progress data for the selected filters." />}
      >
        <div className="space-y-4">
          {(data ?? []).map((group) => (
            <Card key={group.teacher.id} className="overflow-hidden">
              <div className="px-5 py-3 border-b border-line bg-surface">
                <h3 className="font-display font-semibold text-ink">{group.teacher.name}</h3>
                <p className="text-xs text-ink/50">{group.teacher.employeeId}</p>
              </div>
              <Table>
                <THead>
                  <Th>Class</Th>
                  <Th>Subject</Th>
                  <Th>Chapters</Th>
                  <Th className="w-40">Avg Completion</Th>
                  <Th>Completed</Th>
                  <Th>Delayed</Th>
                </THead>
                <tbody>
                  {group.plans.map((p, i) => (
                    <Tr key={i}>
                      <Td className="font-semibold text-ink">{p.class.name}</Td>
                      <Td>{p.subject.name}</Td>
                      <Td>{p.totalChapters}</Td>
                      <Td><ProgressBar value={p.avgCompletion} /></Td>
                      <Td className="text-success font-semibold">{p.completed}</Td>
                      <Td className={p.delayed > 0 ? 'text-coral font-semibold' : ''}>{p.delayed}</Td>
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
