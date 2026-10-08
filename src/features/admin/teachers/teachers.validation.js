export const TEACHER_NAME_MIN = 2
export const TEACHER_NAME_MAX = 100
export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
export const PHONE_PATTERN = /^\d{10,15}$/

const isInt = (v) => /^\d+$/.test(String(v).trim())

export function validateTeacherForm(form) {
  const errors = {}
  const name = form.name.trim()

  if (name.length < TEACHER_NAME_MIN || name.length > TEACHER_NAME_MAX) {
    errors.name = `Name must be ${TEACHER_NAME_MIN}-${TEACHER_NAME_MAX} characters.`
  }
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (!PHONE_PATTERN.test(form.phone.trim())) errors.phone = 'Phone must be 10-15 digits.'
  if (!form.gender) errors.gender = 'Select a gender.'

  const salary = Number(form.salary)
  if (form.salary === '' || !Number.isFinite(salary) || salary <= 0) errors.salary = 'Salary must be a positive number.'

  if (!form.qualification.trim()) errors.qualification = 'Qualification is required.'

  if (form.experienceYears === '' || !isInt(form.experienceYears)) {
    errors.experienceYears = 'Enter whole years (0 or more).'
  }
  if (form.experienceMonths === '' || !isInt(form.experienceMonths) || Number(form.experienceMonths) > 11) {
    errors.experienceMonths = 'Months must be 0-11.'
  }

  if (!form.subjects.length) errors.subjects = 'Add at least one subject.'
  if (!form.joiningDate) errors.joiningDate = 'Joining date is required.'

  return errors
}

export function validateSubjectAssignment({ subject, classId }) {
  const errors = {}
  if (!subject) errors.subject = 'Select a subject.'
  if (!classId) errors.classId = 'Select a class.'
  return errors
}
