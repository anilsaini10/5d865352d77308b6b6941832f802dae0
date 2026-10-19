/** Timeline window for free/busy views: 7 AM to 5 PM. */
export const DAY_START = '07:00'
export const DAY_END = '17:00'

export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm ?? '').split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN
}

/** 240 → "4h", 90 → "1h 30m", 45 → "45m" */
export function formatMinutes(total) {
  if (total == null) return '—'
  const h = Math.floor(total / 60)
  const m = total % 60
  return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ') || '0m'
}

// Literal class names so Tailwind generates them.
export const BUSY_META = {
  CLASS: { label: 'Class', block: 'bg-info/70 text-white', chip: 'text-info' },
  INVIGILATION: { label: 'Exam duty', block: 'bg-board/80 text-on-board', chip: 'text-board' },
  LEAVE: { label: 'On leave', block: 'bg-warning/70 text-ink', chip: 'text-warning' },
  ABSENT: { label: 'Absent', block: 'bg-coral/70 text-white', chip: 'text-coral' },
}
export const busyMeta = (type) => BUSY_META[type] ?? { label: type, block: 'bg-ink/40 text-white', chip: 'text-ink/60' }

export const CLOSED_REASONS = {
  SUNDAY: 'Sunday',
  HOLIDAY: 'School holiday',
  GOVERNMENT_HOLIDAY: 'Government holiday',
  VACATION: 'Vacation',
}

export function closedText(schoolClosed) {
  if (!schoolClosed) return ''
  const reason = CLOSED_REASONS[schoolClosed.reason] ?? schoolClosed.reason
  return schoolClosed.title && schoolClosed.title !== reason ? `${schoolClosed.title} (${reason})` : reason
}

/** One-line description of a busy block: "Class 2 - A · Computer" or its title. */
export const busyLabel = (b) => b.title || [b.className && `${b.className}${b.sectionName ? ` - ${b.sectionName}` : ''}`, b.subjectName].filter(Boolean).join(' · ') || busyMeta(b.type).label

export const DAY_SHORT = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun' }
