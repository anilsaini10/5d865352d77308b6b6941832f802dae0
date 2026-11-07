export const PLAN_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
}

export const PLAN_STATUS_OPTIONS = [
  { value: PLAN_STATUS.DRAFT, label: 'Draft' },
  { value: PLAN_STATUS.ACTIVE, label: 'Active' },
  { value: PLAN_STATUS.COMPLETED, label: 'Completed' },
  { value: PLAN_STATUS.ARCHIVED, label: 'Archived' },
]

export const CHAPTER_PROGRESS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
}

export const SCHEDULE_STATUS = {
  AHEAD: 'AHEAD',
  ON_TRACK: 'ON_TRACK',
  DELAYED: 'DELAYED',
}

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

export const STATUS_TONE = {
  DRAFT: 'neutral',
  ACTIVE: 'info',
  COMPLETED: 'success',
  ARCHIVED: 'warning',
  NOT_STARTED: 'neutral',
  IN_PROGRESS: 'info',
  AHEAD: 'success',
  ON_TRACK: 'info',
  DELAYED: 'danger',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
}

export const STATUS_LABEL = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  AHEAD: 'Ahead',
  ON_TRACK: 'On Track',
  DELAYED: 'Delayed',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export function sessionYearLabel(year) {
  if (!year) return '—'
  return `${year}-${String(year + 1).slice(2)}`
}

export function currentSessionYear() {
  const now = new Date()
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
}
