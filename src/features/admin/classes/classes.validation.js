export const CLASS_NAME_MAX = 50
export const SECTION_NAME_MAX = 20

const isPositiveInt = (value) => /^\d+$/.test(String(value).trim()) && Number(value) > 0

export function validateClassFields({ name, numericLevel }) {
  const errors = {}
  const trimmed = name?.trim() ?? ''
  if (!trimmed) errors.name = 'Class name is required.'
  else if (trimmed.length > CLASS_NAME_MAX) errors.name = `Class name must be at most ${CLASS_NAME_MAX} characters.`
  if (!isPositiveInt(numericLevel)) errors.numericLevel = 'Enter a whole number greater than 0.'
  return errors
}

export function validateSectionFields({ name, capacity }) {
  const errors = {}
  const trimmed = name?.trim() ?? ''
  if (!trimmed) errors.name = 'Section name is required.'
  else if (trimmed.length > SECTION_NAME_MAX) errors.name = `At most ${SECTION_NAME_MAX} characters.`
  if (!isPositiveInt(capacity)) errors.capacity = 'Enter a whole number greater than 0.'
  return errors
}

/**
 * Create-class form: { name, numericLevel, sections: [{ name, capacity }] }.
 * Section errors come back as `errors.sections[i] = { name?, capacity? }`.
 */
export function validateCreateClassForm(form) {
  const errors = validateClassFields(form)

  if (form.sections.length === 0) {
    errors.sectionsGeneral = 'Add at least one section.'
    return errors
  }

  const seen = new Map()
  const sectionErrors = form.sections.map((s, i) => {
    const e = validateSectionFields(s)
    const key = s.name.trim().toLowerCase()
    if (key && !e.name) {
      if (seen.has(key)) e.name = 'Duplicate section name.'
      else seen.set(key, i)
    }
    return e
  })
  if (sectionErrors.some((e) => Object.keys(e).length > 0)) errors.sections = sectionErrors

  return errors
}
