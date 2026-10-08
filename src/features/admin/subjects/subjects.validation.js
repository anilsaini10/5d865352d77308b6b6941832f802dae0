export const SUBJECT_NAME_MAX = 100

export function validateSubjectForm({ name }) {
  const errors = {}
  const trimmed = name?.trim() ?? ''
  if (!trimmed) errors.name = 'Subject name is required.'
  else if (trimmed.length > SUBJECT_NAME_MAX) errors.name = `Subject name must be at most ${SUBJECT_NAME_MAX} characters.`
  return errors
}
