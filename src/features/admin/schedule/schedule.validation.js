import { SCHEDULE_TYPES } from '../constants.js'

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
export const BREAK_TITLE_MAX = 100
export const ROOM_MAX = 30

/** "HH:MM" or "HH:MM:SS" → "HH:MM" */
export const toHHMM = (value) => (value ? String(value).slice(0, 5) : '')

export function validateScheduleForm({ type, day, startTime, endTime, subjectId, teacherId, title, roomNo }) {
  const errors = {}

  if (!day) errors.day = 'Select a day.'

  if (!TIME_PATTERN.test(startTime || '')) errors.startTime = 'Enter a start time.'
  if (!TIME_PATTERN.test(endTime || '')) errors.endTime = 'Enter an end time.'
  if (!errors.startTime && !errors.endTime && endTime <= startTime) {
    errors.endTime = 'End time must be after the start time.'
  }

  if (type === SCHEDULE_TYPES.CLASS_PERIOD) {
    if (!subjectId) errors.subjectId = 'Select a subject.'
    if (!teacherId) errors.teacherId = 'Select a teacher.'
  } else {
    const t = title?.trim() ?? ''
    if (!t) errors.title = 'Enter a title, e.g. "Lunch Break".'
    else if (t.length > BREAK_TITLE_MAX) errors.title = `Title must be at most ${BREAK_TITLE_MAX} characters.`
  }

  if ((roomNo?.trim() ?? '').length > ROOM_MAX) errors.roomNo = `Room must be at most ${ROOM_MAX} characters.`

  return errors
}
