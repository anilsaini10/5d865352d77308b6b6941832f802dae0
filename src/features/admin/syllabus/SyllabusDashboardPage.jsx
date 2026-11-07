import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, BookOpen, AlertTriangle, CheckCircle2, Clock, FileText, Users, ArrowRight } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { AsyncContent, Card, Button, Badge, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { syllabusMonitorApi } from './syllabus.api.js'
import { currentSessionYear, sessionYearLabel, STATUS_LABEL, STATUS_TONE } from './syllabus.constants.js'

const yearOptions = () => {
  const cur = currentSessionYear()
  return Array.from({ length: 4 }, (_, i) => cur - 2 + i)
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <Card className={`p-5 ${accent || ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-ink mt-1">{value ?? '—'}</p>
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-board/5 flex items-center justify-center">
            <Icon size={20} className="text-board/60" />
          </div>
        )}
      </div>
    </Card>
  )
}

function BreakdownCard({ title, items }) {
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-ink mb-3">{title}</h3>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge tone={item.tone}>{item.label}</Badge>
            </div>
            <span className="text-sm font-bold text-ink">{item.count}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function SyllabusDashboardPage() {
  const navigate = useNavigate()
  const [sessionYear, setSessionYear] = useState(currentSessionYear())

  const { data, loading, error } = useFetch(
    () => syllabusMonitorApi.dashboard(sessionYear),
    [sessionYear],
    { enabled: !!sessionYear, errorMessage: 'Could not load dashboard.' }
  )

  const chapterItems = data
    ? [
        { label: STATUS_LABEL.NOT_STARTED, count: data.statusBreakdown.notStarted, tone: STATUS_TONE.NOT_STARTED },
        { label: STATUS_LABEL.IN_PROGRESS, count: data.statusBreakdown.inProgress, tone: STATUS_TONE.IN_PROGRESS },
        { label: STATUS_LABEL.COMPLETED, count: data.statusBreakdown.completed, tone: STATUS_TONE.COMPLETED },
      ]
    : []

  const planItems = data
    ? [
        { label: STATUS_LABEL.DRAFT, count: data.planStatusBreakdown.draft, tone: STATUS_TONE.DRAFT },
        { label: STATUS_LABEL.ACTIVE, count: data.planStatusBreakdown.active, tone: STATUS_TONE.ACTIVE },
        { label: STATUS_LABEL.COMPLETED, count: data.planStatusBreakdown.completed, tone: STATUS_TONE.COMPLETED },
        { label: STATUS_LABEL.ARCHIVED, count: data.planStatusBreakdown.archived, tone: STATUS_TONE.ARCHIVED },
      ]
    : []

  return (
    <AppShell title="Syllabus Dashboard" subtitle={`Session ${sessionYearLabel(sessionYear)}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <label className="text-sm font-semibold text-ink/70">Session Year</label>
        <select
          className={`${selectClass} sm:w-44`}
          value={sessionYear}
          onChange={(e) => setSessionYear(Number(e.target.value))}
        >
          {yearOptions().map((y) => (
            <option key={y} value={y}>{sessionYearLabel(y)}</option>
          ))}
        </select>
      </div>

      <AsyncContent loading={loading} error={error} empty={false}>
        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Plans" value={data.totalPlans} icon={FileText} />
              <StatCard label="Total Chapters" value={data.totalChapters} icon={BookOpen} />
              <StatCard label="Avg Completion" value={`${data.avgCompletion}%`} icon={CheckCircle2} />
              <StatCard
                label="Delayed"
                value={data.delayedCount}
                icon={AlertTriangle}
                accent={data.delayedCount > 0 ? 'border-coral/30 bg-coral/5' : ''}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <BreakdownCard title="Chapter Status" items={chapterItems} />
              <BreakdownCard title="Plan Status" items={planItems} />
            </div>

            <Card className="p-5">
              <h3 className="font-display font-semibold text-ink mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button variant="secondary" icon={BarChart3} onClick={() => navigate('/syllabus/reports/class')}>
                  Class Progress
                </Button>
                <Button variant="secondary" icon={Users} onClick={() => navigate('/syllabus/reports/teacher')}>
                  Teacher Progress
                </Button>
                <Button variant="secondary" icon={AlertTriangle} onClick={() => navigate('/syllabus/reports/delayed')}>
                  Delayed Chapters
                </Button>
                <Button variant="secondary" icon={Clock} onClick={() => navigate('/syllabus/approvals')}>
                  Approvals
                </Button>
              </div>
            </Card>
          </>
        )}
      </AsyncContent>
    </AppShell>
  )
}
