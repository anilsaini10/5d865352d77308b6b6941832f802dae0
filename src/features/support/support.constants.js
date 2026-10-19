export const SUBJECT_MAX = 150
export const HTML_MAX = 20000

// Exact strings the backend accepts.
export const CATEGORIES = ['Question', 'Problem / bug', 'Feature request', 'Account or login', 'Other']

export const SUPPORT_STATUSES = [
  { value: 'OPEN', label: 'Open', tone: 'info' },
  { value: 'IN_PROGRESS', label: 'In progress', tone: 'warning' },
  { value: 'RESOLVED', label: 'Resolved', tone: 'success' },
  { value: 'CLOSED', label: 'Closed', tone: 'neutral' },
]

export const statusMeta = (value) => SUPPORT_STATUSES.find((s) => s.value === value) ?? { value, label: value, tone: 'neutral' }

export const SENDER_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'PARENT', label: 'Parent' },
]

/** Fired after the inbox changes so the sidebar's OPEN badge can refetch. */
export const SUPPORT_CHANGED_EVENT = 'support:changed'
