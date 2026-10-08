import { todayInput } from '../../../utils/format.js'

export const NAME_MIN = 2
export const NAME_MAX = 100
export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
export const PHONE_PATTERN = /^\+?[\d\s-]{10,15}$/

export const emptyStudentForm = {
  name: '',
  gender: '',
  dateOfBirth: '',
  classId: '',
  sectionId: '',
  rollNo: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  bloodGroup: '',
  address: '',
}

const dateOnly = (value) => (value ? String(value).slice(0, 10) : '')

export function studentToForm(student) {
  return {
    name: student.name ?? '',
    gender: student.gender ?? '',
    dateOfBirth: dateOnly(student.dateOfBirth),
    classId: student.classId ?? '',
    sectionId: student.sectionId ?? '',
    rollNo: student.rollNo != null ? String(student.rollNo) : '',
    parentName: student.parentName ?? '',
    parentPhone: student.parentPhone ?? '',
    parentEmail: student.parentEmail ?? '',
    bloodGroup: student.bloodGroup ?? '',
    address: student.address ?? '',
  }
}

/** Trimmed request body; empty optional fields are left undefined. */
export function studentFormToPayload(form) {
  return {
    name: form.name.trim(),
    gender: form.gender,
    dateOfBirth: form.dateOfBirth,
    classId: form.classId,
    sectionId: form.sectionId,
    rollNo: Number(form.rollNo),
    parentName: form.parentName.trim(),
    parentPhone: form.parentPhone.trim(),
    parentEmail: form.parentEmail.trim(),
    bloodGroup: form.bloodGroup || undefined,
    address: form.address.trim() || undefined,
  }
}

export function validateStudentForm(form) {
  const errors = {}
  const name = form.name.trim()
  const parentName = form.parentName.trim()
  const phone = form.parentPhone.trim()
  const email = form.parentEmail.trim()
  const roll = Number(form.rollNo)

  if (name.length < NAME_MIN || name.length > NAME_MAX) errors.name = `Name must be ${NAME_MIN}-${NAME_MAX} characters.`
  if (!form.gender) errors.gender = 'Select a gender.'
  if (!form.dateOfBirth) errors.dateOfBirth = 'Enter the date of birth.'
  else if (form.dateOfBirth > todayInput()) errors.dateOfBirth = 'Date of birth cannot be in the future.'
  if (!form.classId) errors.classId = 'Select a class.'
  if (!form.sectionId) errors.sectionId = 'Select a section.'
  if (form.rollNo === '' || !Number.isInteger(roll) || roll < 1) errors.rollNo = 'Roll number must be a positive whole number.'
  if (parentName.length < NAME_MIN || parentName.length > NAME_MAX) errors.parentName = `Parent name must be ${NAME_MIN}-${NAME_MAX} characters.`
  if (!PHONE_PATTERN.test(phone)) errors.parentPhone = 'Phone must be 10-15 characters (digits).'
  if (!EMAIL_PATTERN.test(email)) errors.parentEmail = 'Enter a valid email address.'

  return errors
}
