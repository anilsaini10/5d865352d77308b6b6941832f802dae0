import { fmtCount, fmtPct } from '../analytics.helpers.js'

const CHIPS = [
  { key: 'present', label: 'Present', tone: 'bg-success/10 text-success' },
  { key: 'absent', label: 'Absent', tone: 'bg-coral/10 text-coral' },
  { key: 'late', label: 'Late', tone: 'bg-warning/15 text-warning' },
  { key: 'approvedLeave', label: 'Leave', tone: 'bg-info/10 text-info' },
]

export default function AttendanceChips({ data, showPercentage = true }) {
  if (!data) return null
  return (
    <div>
      {showPercentage && (
        <p className="text-2xl font-semibold text-ink mb-3">
          {data.attendancePercentage != null ? fmtPct(data.attendancePercentage) : '—'}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <span key={c.key} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.tone}`}>
            {c.label}: {fmtCount(data[c.key])}
          </span>
        ))}
        {data.markedHoliday > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-board/10 text-board">
            Holiday: {fmtCount(data.markedHoliday)}
          </span>
        )}
      </div>
    </div>
  )
}
