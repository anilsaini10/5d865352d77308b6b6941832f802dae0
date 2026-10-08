import { todayInput } from '../../../utils/format.js'

export function validateMarkDate(date) {
  if (!date) return 'Pick a date.'
  if (date > todayInput()) return "Attendance can't be marked for a future date."
  return ''
}

/** History filters: either a single date or a from/to range, never both. */
export function validateHistoryRange({ mode, from, to }) {
  if (mode === 'range' && from && to && from > to) return '"From" must be on or before "To".'
  return ''
}
