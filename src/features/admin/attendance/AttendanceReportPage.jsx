import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarCheck, ChevronRight } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { AsyncContent, Card, EmptyState, Field, inputClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { formatDate, formatNumber, todayInput } from '../../../utils/format.js'
import { attendanceReportApi } from './attendance.api.js'
import AttendanceBar, { Legend, SEGMENTS, resolveDate } from './components/AttendanceBar.jsx'

const formatPct = (value) => `${Math.round((Number(value) || 0) * 10) / 10}%`

function SummaryTile({ label, value, hint, accent }) {
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 flex items-center gap-1.5">
        {accent && <span className={`w-2 h-2 rounded-sm ${accent}`} aria-hidden="true" />}
        {label}
      </p>
      <p className="text-2xl font-semibold text-ink mt-1">{value}</p>
      {hint && <p className="text-xs text-ink/45 mt-0.5">{hint}</p>}
    </div>
  )
}

function ClassRow({ row, onOpen }) {
  const marked = row.total > 0
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left px-4 sm:px-5 py-4 border-b border-line last:border-0 hover:bg-line/20 transition-colors group"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-ink truncate">{row.className}</span>
        <span className="flex items-center gap-1 shrink-0">
          {marked ? (
            <span className="font-display text-lg font-semibold text-ink">{formatPct(row.percentage)}</span>
          ) : (
            <span className="text-xs font-semibold text-ink/45">Not marked yet</span>
          )}
          <ChevronRight size={16} className="text-ink/30 group-hover:text-ink/60" />
        </span>
      </div>
      <AttendanceBar counts={row} className="h-2.5 mt-2" />
      {marked && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-ink/60">
          {SEGMENTS.map((s) => (
            <span key={s.key}>
              <span className={`font-semibold ${s.text}`}>{formatNumber(row[s.key])}</span> {s.label.toLowerCase()}
            </span>
          ))}
          <span className="text-ink/45">of {formatNumber(row.total)} marked</span>
        </div>
      )}
    </button>
  )
}

export default function AttendanceReportPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const date = resolveDate(searchParams.get('date'))

  const { data, loading, error } = useFetch(() => attendanceReportApi.classes({ date }), [date], {
    errorMessage: 'Could not load attendance.',
  })

  const rows = data?.classes ?? []

  const summary = useMemo(() => {
    const sum = { present: 0, late: 0, leave: 0, absent: 0, total: 0, weighted: 0, markedClasses: 0 }
    for (const r of rows) {
      for (const s of SEGMENTS) sum[s.key] += r[s.key] ?? 0
      sum.total += r.total ?? 0
      // Weight each class's percentage by its size so the overall figure uses the backend's own definition.
      sum.weighted += (Number(r.percentage) || 0) * (r.total ?? 0)
      if (r.total > 0) sum.markedClasses += 1
    }
    sum.percentage = sum.total > 0 ? sum.weighted / sum.total : 0
    return sum
  }, [rows])

  const setDate = (value) => {
    const next = resolveDate(value)
    setSearchParams(next === todayInput() ? {} : { date: next }, { replace: true })
  }

  return (
    <AppShell title="Student attendance" subtitle={`Class-wise report for ${formatDate(date)}`}>
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-5">
        <div className="sm:w-56">
          <Field label="Date">
            <input type="date" className={inputClass} value={date} max={todayInput()} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <p className="text-sm text-ink/50 sm:pb-2.5">Attendance is marked by teachers. This report is read-only.</p>
      </div>

      <AsyncContent
        loading={loading && !data}
        error={error}
        empty={rows.length === 0}
        emptyState={
          <Card>
            <EmptyState icon={CalendarCheck} title="No classes found" message="Create classes and enrol students to see attendance here." />
          </Card>
        }
      >
        {summary.total === 0 ? (
          <Card className="mb-5">
            <EmptyState
              icon={CalendarCheck}
              title="No attendance marked yet"
              message={`Teachers haven't marked attendance for ${formatDate(date)}. Pick another date or check back later.`}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
            <div className="col-span-2">
              <SummaryTile
                label="Overall attendance"
                value={formatPct(summary.percentage)}
                hint={`${summary.markedClasses} of ${rows.length} classes marked · ${formatNumber(summary.total)} students`}
              />
            </div>
            {SEGMENTS.map((s) => (
              <SummaryTile key={s.key} label={s.label} value={formatNumber(summary[s.key])} accent={s.bar} />
            ))}
          </div>
        )}

        <Card className={loading ? 'opacity-60 transition-opacity' : ''}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-line">
            <h2 className="font-display font-semibold text-ink">Classes</h2>
            <Legend />
          </div>
          {rows.map((r) => (
            <ClassRow key={r.classId} row={r} onOpen={() => navigate(`/attendance/${r.classId}?date=${date}`)} />
          ))}
        </Card>
      </AsyncContent>
    </AppShell>
  )
}
