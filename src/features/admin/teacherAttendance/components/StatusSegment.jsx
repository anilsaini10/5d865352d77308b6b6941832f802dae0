import { ATTENDANCE_STATUSES } from '../../constants.js'

const SHORT = { PRESENT: 'P', ABSENT: 'A', LATE: 'L', LEAVE: 'Lv', HOLIDAY: 'H' }

const SELECTED = {
  PRESENT: 'bg-success/15 text-success border-success/40',
  ABSENT: 'bg-coral/15 text-coral border-coral/40',
  LATE: 'bg-warning/15 text-warning border-warning/40',
  LEAVE: 'bg-info/15 text-info border-info/40',
  HOLIDAY: 'bg-line/60 text-ink/70 border-ink/20',
}

/** P / A / L / Lv segmented picker for one teacher's attendance status. */
export default function StatusSegment({ value, onChange, name, disabled }) {
  return (
    <div role="radiogroup" aria-label={`Attendance for ${name}`} className="inline-flex gap-1">
      {ATTENDANCE_STATUSES.map((s) => {
        const selected = value === s.value
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={s.label}
            title={s.label}
            disabled={disabled}
            onClick={() => onChange(s.value)}
            className={`min-w-[2.25rem] px-2 py-1.5 rounded-lg border text-xs font-bold transition-colors disabled:opacity-50 ${
              selected ? SELECTED[s.value] : 'border-line text-ink/45 hover:text-ink hover:bg-line/40'
            }`}
          >
            {SHORT[s.value]}
          </button>
        )
      })}
    </div>
  )
}
