const LOCALE = 'en-IN'

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' })
}

/** "YYYY-MM-DD" (a date-only value, no timezone) → "01 Nov 2026". Never goes through new Date(string), which can shift by a day. */
export function formatDay(value) {
  if (!value) return '—'
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' })
}

/** "YYYY-MM-DD" plus n days, as "YYYY-MM-DD" (calendar math in UTC, so no DST/timezone drift). */
export function addDays(value, n) {
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function formatDateRange(from, to) {
  if (!to || String(from).slice(0, 10) === String(to).slice(0, 10)) return formatDate(from)
  return `${formatDate(from)} – ${formatDate(to)}`
}

/** "14:05" → "2:05 PM" */
export function formatTime(hhmm) {
  if (!hhmm) return '—'
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`
}

export function formatCurrency(value) {
  if (value == null || value === '') return '—'
  return Number(value).toLocaleString(LOCALE, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
}

export function formatNumber(value) {
  return Number(value ?? 0).toLocaleString(LOCALE)
}

/** ISO string or Date → "YYYY-MM-DD" for <input type="date">, in local time. */
export function toDateInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** ISO string → "YYYY-MM-DDTHH:MM" for <input type="datetime-local">, in local time. */
export function toDateTimeInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** <input type="datetime-local"> value → ISO string (or undefined when empty). */
export function fromDateTimeInput(value) {
  return value ? new Date(value).toISOString() : undefined
}

export function todayInput() {
  return toDateInput(new Date())
}

export function experienceLabel(years, months) {
  const parts = []
  if (years) parts.push(`${years} yr${years === 1 ? '' : 's'}`)
  if (months) parts.push(`${months} mo`)
  return parts.length ? parts.join(' ') : 'Fresher'
}

export function titleCase(value) {
  if (!value) return ''
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ')
}

/** Drops undefined / '' / null so optional query params aren't sent. */
export function cleanParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null))
}

/** "2h ago", "3d ago", "just now" — falls back to a date after a month. */
export function timeAgo(value) {
  if (!value) return '—'
  const diff = Date.now() - new Date(value).getTime()
  if (Number.isNaN(diff)) return '—'
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return day < 30 ? `${day}d ago` : formatDate(value)
}
