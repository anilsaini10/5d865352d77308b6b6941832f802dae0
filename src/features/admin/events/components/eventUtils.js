import { formatDate, toDateInput } from '../../../../utils/format.js'
import { EVENT_TYPES, enumMeta } from '../../constants.js'

/**
 * Event dates are calendar dates; the API returns them as ISO strings at UTC
 * midnight, so take the date part verbatim instead of shifting to local time.
 */
export function dayKey(value) {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  return toDateInput(value)
}

export function eventTypeMeta(type) {
  return enumMeta(EVENT_TYPES, type)
}

/** Tone → classes for calendar chips and dots (Badge handles the rest). */
export const TONE_CHIP = {
  success: 'bg-success/15 text-success',
  danger: 'bg-coral/15 text-coral',
  info: 'bg-info/15 text-info',
  warning: 'bg-warning/20 text-warning',
  neutral: 'bg-line/70 text-ink/70',
  primary: 'bg-board/15 text-board',
  maroon: 'bg-coral text-white',
  redmid: 'bg-coral/35 text-coral',
  amber: 'bg-chalk/30 text-chalk-ink',
}

export const TONE_DOT = {
  success: 'bg-success',
  danger: 'bg-coral',
  info: 'bg-info',
  warning: 'bg-warning',
  neutral: 'bg-ink/40',
  primary: 'bg-board',
  maroon: 'bg-coral ring-2 ring-coral/30',
  redmid: 'bg-coral/60',
  amber: 'bg-chalk',
}

/** "YYYY-MM-DD" → local Date at midnight. */
export function parseDayKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Formats an event's start/end as a date or date range without timezone drift. */
export function formatEventRange(event) {
  const start = dayKey(event.startDate)
  const end = dayKey(event.endDate)
  if (!start) return '—'
  if (!end || end === start) return formatDate(parseDayKey(start))
  return `${formatDate(parseDayKey(start))} – ${formatDate(parseDayKey(end))}`
}
