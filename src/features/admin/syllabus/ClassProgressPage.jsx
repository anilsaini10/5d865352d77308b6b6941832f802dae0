import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Eye, ExternalLink } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { AsyncContent, Badge, Button, Card, EmptyState, IconButton, Table, THead, Th, Tr, Td, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useClasses } from '../classes/useClasses.js'
import { subjectsApi } from '../subjects/subjects.api.js'
import { syllabusMonitorApi } from './syllabus.api.js'
import { plansApi } from './syllabus.api.js'
import { currentSessionYear, sessionYearLabel, STATUS_LABEL, STATUS_TONE } from './syllabus.constants.js'
import { formatDay } from '../../../utils/format.js'
import Drawer from '../billing/components/Drawer.jsx'

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

function PlanDrawerContent({ section, classId, sessionYear, onNavigate }) {
  const planId = section.planId
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    const load = async () => {
      try {
        if (planId) {
          const result = await plansApi.get(planId)
          if (!cancelled) setPlan(result)
        } else {
          const result = await plansApi.list({
            sessionYear,
            classId,
            sectionId: section.section?.id,
            subjectId: section.subject?.id,
            page: 1,
            pageSize: 1,
          })
          const found = result?.items?.[0]
          if (!cancelled) {
            if (found) setPlan(found)
            else setError('No matching plan found.')
          }
        }
      } catch {
        if (!cancelled) setError('Could not load plan details.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [planId, classId, sessionYear, section.section?.id, section.subject?.id])

  if (loading) return <p className="text-sm text-ink/50 py-6 text-center">Loading plan…</p>
  if (error) return <p className="text-sm text-coral py-6 text-center">{error}</p>
  if (!plan) return <p className="text-sm text-ink/50 py-6 text-center">Plan not found.</p>

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-line rounded-xl p-3">
          <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide">Status</p>
          <Badge tone={STATUS_TONE[plan.status]}>{STATUS_LABEL[plan.status] ?? plan.status}</Badge>
        </div>
        <div className="bg-surface border border-line rounded-xl p-3">
          <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide">Teacher</p>
          <p className="text-sm font-semibold text-ink mt-0.5">{plan.teacher?.name ?? 'Unassigned'}</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-3">
          <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide">Chapters</p>
          <p className="text-sm font-semibold text-ink mt-0.5">{plan.summary?.totalChapters ?? plan.chapterCount ?? 0}</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-3">
          <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide">Avg Completion</p>
          <p className="text-sm font-semibold text-ink mt-0.5">{plan.summary?.avgCompletion ?? section.avgCompletion ?? 0}%</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-3">
          <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide">Completed</p>
          <p className="text-sm font-semibold text-success mt-0.5">{plan.summary?.completed ?? section.completed ?? 0}</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-3">
          <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide">Delayed</p>
          <p className={`text-sm font-semibold mt-0.5 ${(plan.summary?.delayed ?? section.delayed ?? 0) > 0 ? 'text-coral' : 'text-ink'}`}>{plan.summary?.delayed ?? section.delayed ?? 0}</p>
        </div>
      </div>

      {plan.remarks && (
        <div>
          <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide mb-1">Remarks</p>
          <p className="text-sm text-ink/70">{plan.remarks}</p>
        </div>
      )}

      {plan.chapters && plan.chapters.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide mb-2">Chapters</p>
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden">
            {plan.chapters.map((ch) => (
              <li key={ch.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{ch.sequenceNumber}. {ch.chapter?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge tone={STATUS_TONE[ch.status]}>{STATUS_LABEL[ch.status] ?? ch.status}</Badge>
                    {ch.plannedStartDate && (
                      <span className="text-xs text-ink/45">{formatDay(ch.plannedStartDate)} – {formatDay(ch.plannedEndDate)}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-ink shrink-0">{ch.completionPercentage ?? 0}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button icon={ExternalLink} onClick={() => onNavigate(plan.id)} className="w-full">
        Open Full Plan
      </Button>
    </>
  )
}

export default function ClassProgressPage() {
  const navigate = useNavigate()
  const [sessionYear, setSessionYear] = useState(currentSessionYear())
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [drawerSection, setDrawerSection] = useState(null)
  const [drawerClassId, setDrawerClassId] = useState(null)

  const { classes } = useClasses()
  const { data: subjects } = useFetch(() => subjectsApi.list(), [], { errorMessage: 'Could not load subjects.' })

  const { data, loading, error } = useFetch(
    () => syllabusMonitorApi.classProgress({ sessionYear, classId: classId || undefined, subjectId: subjectId || undefined }),
    [sessionYear, classId, subjectId],
    { enabled: !!sessionYear, errorMessage: 'Could not load class progress.' }
  )

  const openPlanDrawer = (section, groupClassId) => {
    setDrawerSection(section)
    setDrawerClassId(groupClassId)
  }

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
                  <Th />
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
                      <Td>
                        <IconButton icon={Eye} label="View Plan" tone="primary" onClick={() => openPlanDrawer(s, group.class.id)} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ))}
        </div>
      </AsyncContent>

      {drawerSection && (
        <Drawer
          label={`${drawerSection.section.name} — ${drawerSection.subject.name} Plan`}
          onClose={() => setDrawerSection(null)}
          header={
            <>
              <h2 className="font-display text-xl font-semibold text-ink truncate">{drawerSection.section.name} — {drawerSection.subject.name}</h2>
              <p className="text-sm text-ink/55 mt-0.5">Plan Details · {sessionYearLabel(sessionYear)}</p>
            </>
          }
        >
          <PlanDrawerContent
            section={drawerSection}
            classId={drawerClassId}
            sessionYear={sessionYear}
            onNavigate={(planId) => navigate(`/syllabus/plans/${planId}`)}
          />
        </Drawer>
      )}
    </AppShell>
  )
}
