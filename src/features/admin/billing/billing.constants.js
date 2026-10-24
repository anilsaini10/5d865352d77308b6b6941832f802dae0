export const SUBSCRIPTION_STATUSES = [
  { value: 'PENDING_PAYMENT', label: 'Pending payment', tone: 'amber' },
  { value: 'PAYMENT_FAILED', label: 'Payment failed', tone: 'danger' },
  { value: 'UPCOMING', label: 'Upcoming', tone: 'info' },
  { value: 'ACTIVE', label: 'Active', tone: 'success' },
  { value: 'EXPIRING_SOON', label: 'Expiring soon', tone: 'warning' },
  { value: 'EXPIRED', label: 'Expired', tone: 'neutral' },
  { value: 'CANCELLED', label: 'Cancelled', tone: 'cancelled' },
]

export const statusMeta = (value) =>
  SUBSCRIPTION_STATUSES.find((s) => s.value === value) ?? { value, label: value, tone: 'neutral' }

export const FEATURE_STATUSES = {
  FREE: { label: 'Free', tone: 'success' },
  ACTIVE: { label: 'Active', tone: 'success' },
  EXPIRING_SOON: { label: 'Expiring soon', tone: 'warning' },
  PAYMENT_REQUIRED: { label: 'Payment required', tone: 'danger' },
}

export const featureStatusMeta = (status) =>
  FEATURE_STATUSES[status] ?? { label: status, tone: 'neutral' }

export const ACTION_LABELS = {
  SUBSCRIBE: 'Subscribe',
  RENEW: 'Renew',
  COMPLETE_PAYMENT: 'Payment pending',
  NONE: 'Included by school',
}

export const LOCK_CTA = {
  NEVER_SUBSCRIBED: { label: 'Subscribe', tone: 'primary' },
  EXPIRED: { label: 'Renew', tone: 'primary' },
  PENDING_PAYMENT: { label: 'Payment pending', tone: 'amber' },
}

export const PAYMENT_TONES = {
  CREATED: 'amber',
  SUCCESS: 'success',
  FAILED: 'danger',
  REFUNDED: 'info',
}

export const paiseToRupees = (paise) => Number(paise ?? 0) / 100

export const formatPaise = (paise) =>
  paise == null
    ? '—'
    : paiseToRupees(paise).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
