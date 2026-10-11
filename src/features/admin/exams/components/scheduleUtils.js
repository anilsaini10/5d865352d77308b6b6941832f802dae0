import { getErrorCode, getErrorMessage } from '../../../../api/httpClient.js'
import { formatTime, todayInput } from '../../../../utils/format.js'

const dayOnly = (value) => (value ? String(value).slice(0, 10) : '')

/** "2026-10-20" → Date at local midnight (avoids the UTC shift of `new Date('2026-10-20')`). */
const parseDay = (value) => new Date(`${dayOnly(value)}T00:00:00`)

export function formatPaperDate(value, { weekday = false } = {}) {
  if (!value) return '—'
  const d = parseDay(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', { ...(weekday && { weekday: 'short' }), day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatPaperTime = (paper) => `${formatTime(paper.startTime)} – ${formatTime(paper.endTime)}`

export const examRange = (exam) => ({ min: dayOnly(exam?.startDate) || undefined, max: dayOnly(exam?.endDate) || undefined })

export const isFutureDate = (date) => dayOnly(date) > todayInput()

export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm ?? '').split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN
}

/** Back-to-back (end === start) is not an overlap. */
export const timesOverlap = (a, b) => toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime)

/** Sort by date, then start time. */
export const byDateTime = (a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)

/** Validates the fields shared by the single-paper form and each bulk row. Returns { field: message }. */
export function validatePaperFields({ date, startTime, endTime, maxMarks, roomNo }, exam) {
  const errors = {}
  const { min, max } = examRange(exam)
  if (!date) errors.date = 'Pick a date.'
  else if ((min && date < min) || (max && date > max)) errors.date = 'Date must fall within the exam dates.'
  if (!startTime) errors.startTime = 'Set a start time.'
  if (!endTime) errors.endTime = 'Set an end time.'
  else if (startTime && toMinutes(endTime) <= toMinutes(startTime)) errors.endTime = 'End time must be after the start time.'
  if (maxMarks === '' || !Number.isFinite(Number(maxMarks)) || Number(maxMarks) <= 0) errors.maxMarks = 'Enter max marks greater than 0.'
  if ((roomNo ?? '').trim().length > 50) errors.roomNo = 'Room must be at most 50 characters.'
  return errors
}

/** One-line description of the paper another request clashed with. */
export function describeConflict(c) {
  if (!c) return ''
  const parts = [`${c.className ?? ''} ${c.subjectName ?? ''}`.trim(), `${formatPaperDate(c.date)} ${c.startTime}–${c.endTime}`]
  let text = parts.filter(Boolean).join(', ')
  if (c.examTitle) text += ` (${c.examTitle})`
  if (c.roomNo) text += ` · ${c.roomNo}`
  if (c.invigilatorName) text += ` · ${c.invigilatorName}`
  return text
}

const FIELD_BY_CODE = {
  CLASS_TIME_CONFLICT: 'time',
  INVIGILATOR_TIME_CONFLICT: 'invigilatorId',
  INVIGILATOR_ON_LEAVE: 'invigilatorId',
  INVIGILATOR_INACTIVE: 'invigilatorId',
  INVIGILATOR_NOT_FOUND: 'invigilatorId',
  ROOM_TIME_CONFLICT: 'roomNo',
  SUBJECT_ALREADY_SCHEDULED: 'subjectId',
  SUBJECT_NOT_IN_CLASS: 'subjectId',
  SUBJECT_NOT_FOUND: 'subjectId',
  EXAM_CLASS_NOT_FOUND: 'classId',
  DATE_OUTSIDE_EXAM_RANGE: 'date',
  INVALID_TIME_RANGE: 'time',
  MAX_MARKS_BELOW_EXISTING: 'maxMarks',
}

/**
 * Turns a paper create/update error into something the form can place.
 * `field` is a form field key ('time' covers date/start/end) or null for a general message.
 * @returns {{field: string|null, message: string, conflict: object|null, paperIndex: number|null, code: string|undefined}}
 */
export function paperError(err, fallback) {
  const code = getErrorCode(err)
  const details = err?.response?.data?.error?.details ?? {}
  let message = getErrorMessage(err, fallback)
  if (code === 'MAX_MARKS_BELOW_EXISTING' && details.highestMarks != null) {
    message = `Max marks can't be below the highest marks already saved (${details.highestMarks}).`
  }
  return {
    code,
    field: FIELD_BY_CODE[code] ?? null,
    message,
    conflict: details.conflictWith ?? null,
    paperIndex: Number.isInteger(details.paperIndex) ? details.paperIndex : null,
  }
}
