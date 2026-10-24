export const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'PARENT', label: 'Parent' },
]
export const roleLabel = (v) => ROLE_OPTIONS.find((r) => r.value === v)?.label ?? v

export const SCOPES = [
  { value: 'SELF', label: 'Self', hint: 'A user buys it for themselves.' },
  { value: 'SCHOOL', label: 'School', hint: 'The school admin buys it for the whole school (target role is always Admin).' },
]
export const PLAN_TYPES = [
  { value: 'BASE', label: 'Base', hint: 'The main plan.' },
  { value: 'ADDON', label: 'Add-on', hint: 'Extra features on top of a base plan.' },
]
export const scopeLabel = (v) => SCOPES.find((s) => s.value === v)?.label ?? v
export const planTypeLabel = (v) => PLAN_TYPES.find((s) => s.value === v)?.label ?? v

export const INTERVAL_UNITS = [
  { value: 'DAY', label: 'Day(s)' },
  { value: 'MONTH', label: 'Month(s)' },
  { value: 'YEAR', label: 'Year(s)' },
]

// Status is computed by the backend — only presentation lives here.
export const SUBSCRIPTION_STATUSES = [
  { value: 'PENDING_PAYMENT', label: 'Pending payment', tone: 'amber' },
  { value: 'PAYMENT_FAILED', label: 'Payment failed', tone: 'danger' },
  { value: 'UPCOMING', label: 'Upcoming', tone: 'info' },
  { value: 'ACTIVE', label: 'Active', tone: 'success' },
  { value: 'EXPIRING_SOON', label: 'Expiring soon', tone: 'warning' },
  { value: 'EXPIRED', label: 'Expired', tone: 'neutral' },
  { value: 'CANCELLED', label: 'Cancelled', tone: 'cancelled' },
]
export const statusMeta = (value) => SUBSCRIPTION_STATUSES.find((s) => s.value === value) ?? { value, label: value, tone: 'neutral' }

export const FEATURE_KEY_PATTERN = /^[a-z0-9_]{2,50}$/
export const PLAN_CODE_PATTERN = /^[A-Za-z0-9_]{2,40}$/

/** Amounts are integers in paise. */
export const paiseToRupees = (paise) => Number(paise ?? 0) / 100
export const formatPaise = (paise) =>
  paise == null ? '—' : paiseToRupees(paise).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
/** "499" / "499.50" → 49950, or null when not a valid amount (max 2 decimals, > 0). */
export function rupeesInputToPaise(value) {
  const s = String(value ?? '').trim()
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const paise = Math.round(Number(s) * 100)
  return paise > 0 ? paise : null
}
export const paiseToInput = (paise) => (paise == null ? '' : String(paiseToRupees(paise)))

export function durationLabel(unit, count) {
  const word = { DAY: 'Day', MONTH: 'Month', YEAR: 'Year' }[unit] ?? unit
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** "₹99 – ₹999" or "₹99" or "No prices". Only active prices. */
export function priceRange(prices = []) {
  const amounts = prices.filter((p) => p.isActive).map((p) => p.amount)
  if (!amounts.length) return 'No prices'
  const lo = Math.min(...amounts)
  const hi = Math.max(...amounts)
  return lo === hi ? formatPaise(lo) : `${formatPaise(lo)} – ${formatPaise(hi)}`
}
