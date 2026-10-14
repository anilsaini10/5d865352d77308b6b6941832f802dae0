// Enum values exactly as the backend expects them, plus display labels.

export const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
]

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export const DAY_LABELS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

export const SCHEDULE_TYPES = { CLASS_PERIOD: 'CLASS_PERIOD', BREAK: 'BREAK' }

export const AUDIENCES = [
  { value: 'ALL', label: 'Everyone' },
  { value: 'TEACHER', label: 'Teachers' },
  { value: 'PARENT', label: 'Parents' },
]

export const AUDIENCE_LABELS = Object.fromEntries(AUDIENCES.map((a) => [a.value, a.label]))

export const ANNOUNCEMENT_STATUS_TONES = { SCHEDULED: 'warning', ACTIVE: 'success', EXPIRED: 'neutral' }

export const EVENT_TYPES = [
  { value: 'HOLIDAY', label: 'Holiday', tone: 'success' },
  { value: 'EXAM', label: 'Exam', tone: 'danger' },
  { value: 'MEETING', label: 'Meeting', tone: 'info' },
  { value: 'ACTIVITY', label: 'Activity', tone: 'warning' },
  { value: 'OTHER', label: 'Other', tone: 'neutral' },
]

export const ATTENDANCE_STATUSES = [
  { value: 'PRESENT', label: 'Present', tone: 'success' },
  { value: 'ABSENT', label: 'Absent', tone: 'danger' },
  { value: 'LATE', label: 'Late', tone: 'warning' },
  { value: 'LEAVE', label: 'Leave', tone: 'info' },
  { value: 'HOLIDAY', label: 'Holiday', tone: 'neutral' },
]

export const LEAVE_STATUSES = [
  { value: 'PENDING', label: 'Pending', tone: 'warning' },
  { value: 'APPROVED', label: 'Approved', tone: 'success' },
  { value: 'REJECTED', label: 'Rejected', tone: 'danger' },
]

export const RESULT_STATUSES = [
  { value: 'PENDING', label: 'Pending', tone: 'warning' },
  { value: 'GRADED', label: 'Graded', tone: 'success' },
  { value: 'ABSENT', label: 'Absent', tone: 'danger' },
]

/** Look up { label, tone } for an enum value in one of the lists above. */
export function enumMeta(list, value) {
  return list.find((o) => o.value === value) ?? { value, label: value ?? '—', tone: 'neutral' }
}

export const DEFAULT_PASSWORD_HINT = 'This password is only shown once — share it now.'
