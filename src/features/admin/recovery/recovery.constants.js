export const DEFAULT_PASSWORD = '123456'
export const RECOVERY_CHANGED_EVENT = 'recovery:changed'

export const RECOVERY_STATUSES = [
  { value: 'PENDING', label: 'Pending', tone: 'warning' },
  { value: 'RESOLVED', label: 'Resolved', tone: 'success' },
  { value: 'REJECTED', label: 'Rejected', tone: 'neutral' },
]

export const statusMeta = (value) => RECOVERY_STATUSES.find((s) => s.value === value) ?? { value, label: value, tone: 'neutral' }

export const ROLE_LABELS = { TEACHER: 'Teacher', PARENT: 'Parent' }

/** Tell the sidebar badge (and anything else listening) to refetch the pending count. */
export const notifyRecoveryChanged = () => {
  window.dispatchEvent(new Event(RECOVERY_CHANGED_EVENT))
}

const digits = (value) => String(value ?? '').replace(/\D/g, '')

/** "9876543210" → "98765 43210". Anything that isn't a plain 10-digit number is shown as typed. */
export function formatPhone(value) {
  const d = digits(value)
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : String(value ?? '')
}

export const phonesMatch = (a, b) => {
  const x = digits(a).slice(-10)
  return !!x && x === digits(b).slice(-10)
}

export const emailsMatch = (a, b) => !!a && !!b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

/** Login IDs the user can sign in with — whichever the account actually has. */
export const loginIds = (account) => [account?.email, account?.phone && formatPhone(account.phone), account?.username].filter(Boolean)
