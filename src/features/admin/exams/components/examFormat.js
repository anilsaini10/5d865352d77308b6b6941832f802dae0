import { formatDateRange } from '../../../../utils/format.js'

export function examDates(exam) {
  if (!exam?.startDate && !exam?.endDate) return 'Dates not set'
  return formatDateRange(exam.startDate || exam.endDate, exam.endDate)
}
