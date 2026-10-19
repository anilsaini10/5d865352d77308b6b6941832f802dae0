import { Alert } from '../../../../components/ui.jsx'
import { formatTime } from '../../../../utils/format.js'
import { BUSY_META, busyLabel, busyMeta, closedText, formatMinutes, toMinutes } from '../availability.utils.js'

/**
 * One day's free/busy bar from `window.from` to `window.to`.
 * `day` is a free-slots teacher-day ({ unavailable, busy, free, freeMinutes }); `meta` is the matching `days[]` entry.
 */
export default function FreeBusyTimeline({ day, meta }) {
  if (meta.schoolClosed) return <p className="text-sm text-ink/55 py-2">School closed: {closedText(meta.schoolClosed)}</p>
  if (day.unavailable) {
    const m = busyMeta(day.unavailable.type)
    return <div className={`h-8 rounded-lg flex items-center px-3 text-xs font-semibold ${m.block}`}>{day.unavailable.title || m.label}</div>
  }

  const from = toMinutes(meta.window.from)
  const to = toMinutes(meta.window.to)
  const span = Math.max(1, to - from)
  const pos = (start, end) => {
    const left = Math.max(0, ((toMinutes(start) - from) / span) * 100)
    const right = Math.min(100, ((toMinutes(end) - from) / span) * 100)
    return { left: `${left}%`, width: `${Math.max(0, right - left)}%` }
  }
  const hours = []
  for (let t = Math.ceil(from / 60) * 60; t < to; t += 60) hours.push(t)

  return (
    <div>
      <div className="relative h-8 rounded-lg bg-line/30 overflow-hidden" role="img" aria-label={`Free ${formatMinutes(day.freeMinutes)}`}>
        {day.free.map((f) => (
          <div key={f.startTime} className="absolute inset-y-0 bg-success/25 border-x border-success/40 flex items-center justify-center overflow-hidden" style={pos(f.startTime, f.endTime)} title={`Free ${f.startTime}–${f.endTime} · ${formatMinutes(f.minutes)}`}>
            <span className="text-[10px] font-semibold text-success whitespace-nowrap px-1">{f.startTime}–{f.endTime} · {formatMinutes(f.minutes)}</span>
          </div>
        ))}
        {day.busy.map((b, i) => (
          <div key={`${b.startTime}-${i}`} className={`absolute inset-y-0 flex items-center overflow-hidden px-1 ring-1 ring-surface ${busyMeta(b.type).block}`} style={pos(b.startTime, b.endTime)} title={`${busyLabel(b)} · ${b.startTime}–${b.endTime}${b.roomNo ? ` · Room ${b.roomNo}` : ''}`}>
            <span className="text-[10px] font-semibold truncate">{busyLabel(b)}</span>
          </div>
        ))}
      </div>
      <div className="relative h-4 text-[10px] text-ink/40">
        <span className="absolute left-0">{formatTime(meta.window.from)}</span>
        {/* {hours.map((t) => (
          <span key={t} className="absolute hidden sm:block -translate-x-1/2" style={{ left: `${((t - from) / span) * 100}%` }}>{formatTime(`${String(Math.floor(t / 60)).padStart(2, '0')}:00`).replace(':00', '')}</span>
        ))} */}
        <span className="absolute right-0">{formatTime(meta.window.to)}</span>
      </div>
    </div>
  )
}

export function TimelineLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink/65" aria-label="Legend">
      <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-success/40" aria-hidden="true" />Free</li>
      {Object.entries(BUSY_META).map(([k, m]) => (
        <li key={k} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${m.block.split(' ')[0]}`} aria-hidden="true" />{m.label}</li>
      ))}
    </ul>
  )
}

export function ClosedBanner({ schoolClosed }) {
  return schoolClosed ? <Alert tone="warning" className="mb-4">School closed: {closedText(schoolClosed)}</Alert> : null
}
