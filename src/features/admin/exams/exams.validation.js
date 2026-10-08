export const EXAM_TITLE_MAX = 150
export const EXAM_DESCRIPTION_MAX = 1000

const isPositiveNumber = (value) => value !== '' && value != null && Number.isFinite(Number(value)) && Number(value) > 0

export function validateMaxMarks(value) {
  return isPositiveNumber(value) ? undefined : 'Enter max marks greater than 0.'
}

/** `classRows` is only checked when creating — editing can't change classes. */
export function validateExamForm({ title, description, startDate, endDate, classRows }, { isEdit = false } = {}) {
  const errors = {}
  const t = title?.trim() ?? ''

  if (!t) errors.title = 'Enter a title.'
  else if (t.length > EXAM_TITLE_MAX) errors.title = `Title must be at most ${EXAM_TITLE_MAX} characters.`

  if ((description?.trim() ?? '').length > EXAM_DESCRIPTION_MAX) {
    errors.description = `Description must be at most ${EXAM_DESCRIPTION_MAX} characters.`
  }

  if (startDate && endDate && endDate < startDate) errors.endDate = 'End date can’t be before the start date.'

  if (!isEdit) {
    if (!classRows?.length) {
      errors.classes = 'Add at least one class.'
    } else {
      const seen = new Set()
      const rowErrors = classRows.map((row) => {
        const e = {}
        if (!row.classId) e.classId = 'Select a class.'
        else if (seen.has(row.classId)) e.classId = 'This class is already added.'
        seen.add(row.classId)
        const marksError = validateMaxMarks(row.maxMarks)
        if (marksError) e.maxMarks = marksError
        return e
      })
      if (rowErrors.some((e) => Object.keys(e).length > 0)) errors.classRows = rowErrors
    }
  }

  return errors
}

/** Validates one roster row draft before saving. Returns an error string or ''. */
export function validateResultDraft(draft, maxMarks) {
  if (draft.marks !== '') {
    const n = Number(draft.marks)
    if (!Number.isFinite(n) || n < 0 || (maxMarks != null && n > maxMarks)) {
      return `Marks must be between 0 and ${maxMarks}.`
    }
  }
  if (draft.status === 'GRADED' && draft.marks === '' && !draft.grade.trim()) {
    return 'Enter marks or a grade to mark this as graded.'
  }
  return ''
}
