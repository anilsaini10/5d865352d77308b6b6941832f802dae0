import { todayInput } from '../../../../utils/format.js'

export const SEGMENTS = [
  { key: 'present', label: 'Present', bar: 'bg-success', text: 'text-success' },
  { key: 'late', label: 'Late', bar: 'bg-warning', text: 'text-warning' },
  { key: 'leave', label: 'Leave', bar: 'bg-info', text: 'text-info' },
  { key: 'absent', label: 'Absent', bar: 'bg-coral', text: 'text-coral' },
]

/** Reads a YYYY-MM-DD from the query string, falling back to today and never allowing the future. */
export function resolveDate(raw) {
  const today = todayInput()
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw) || raw > today) return today
  return raw
}

export function Legend({ className = '' }) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink/65 ${className}`} aria-label="Legend">
      {SEGMENTS.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-sm ${s.bar}`} aria-hidden="true" />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

/** Stacked present / late / leave / absent bar. `counts` has those four keys plus `total`. */
export default function AttendanceBar({ counts, className = 'h-2.5' }) {
  const total = counts.total ?? 0
  const label = SEGMENTS.map((s) => `${s.label} ${counts[s.key] ?? 0}`).join(', ')

  return (
    <div className={`flex w-full rounded-full overflow-hidden bg-line/60 gap-px ${className}`} role="img" aria-label={total > 0 ? label : 'No attendance marked'}>
      {total > 0 &&
        SEGMENTS.map((s) => {
          const value = counts[s.key] ?? 0
          if (!value) return null
          return <div key={s.key} className={`h-full ${s.bar}`} style={{ width: `${(value / total) * 100}%` }} title={`${s.label}: ${value}`} />
        })}
    </div>
  )
}
