import { formatNumber } from '../../../utils/format.js'

export function fmtPct(value) {
  if (value == null) return '—'
  return `${Number(value).toFixed(1)}%`
}

export function fmtCount(value) {
  if (value == null) return '—'
  return formatNumber(value)
}

export function fmtDay(value) {
  if (!value) return '—'
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtMonth(value) {
  if (!value) return '—'
  const [y, m] = String(value).split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

export function isNotTracked(value) {
  return value && value.available === false
}

export function sessionLabel(meta) {
  if (!meta?.period) return ''
  const s = meta.period.session
  if (s?.label) return `Session ${s.label}`
  return `${fmtDay(meta.period.startDate)} – ${fmtDay(meta.period.endDate)}`
}

export function updatedAt(meta) {
  if (!meta?.generatedAt) return ''
  const d = new Date(meta.generatedAt)
  return `Updated ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} at ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
}

export function sessionOptions() {
  const now = new Date()
  const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  const opts = [{ value: '', label: `${currentYear}-${String(currentYear + 1).slice(2)} (Current)` }]
  for (let i = 1; i <= 4; i++) {
    const y = currentYear - i
    opts.push({ value: String(y), label: `${y}-${String(y + 1).slice(2)}` })
  }
  return opts
}

export function alertTypeLabel(type) {
  const labels = {
    LOW_ATTENDANCE: 'Low attendance',
    REPEATED_ABSENCE: 'Repeated absence',
    DECLINING_MARKS: 'Declining marks',
    LEARNING_GAP: 'Learning gap',
    MISSING_HOMEWORK: 'Missing homework',
    INCOMPLETE_MARKS_ENTRY: 'Incomplete marks entry',
    DELAYED_GRADING: 'Delayed grading',
    HOMEWORK_NOT_CHECKED: 'Homework not checked',
  }
  return labels[type] || type?.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) || '—'
}

export function evidenceLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}
