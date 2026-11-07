export const NAME_MIN = 2
export const NAME_MAX = 100
export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
export const PHONE_PATTERN = /^\+?[\d\s-]{10,15}$/
export const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9._]{2,29}$/

export const emptyStaffForm = {
  name: '',
  email: '',
  phone: '',
  username: '',
  gender: '',
  customRoleId: '',
  designation: '',
  salary: '',
  qualification: '',
  experienceYears: '0',
  experienceMonths: '0',
  joiningDate: '',
  isActive: true,
}

export function staffToForm(staff) {
  return {
    name: staff.name ?? '',
    email: staff.email ?? '',
    phone: staff.phone ?? '',
    username: staff.username ?? '',
    gender: staff.gender ?? '',
    customRoleId: staff.customRoleId ?? staff.customRole?.id ?? '',
    designation: staff.designation ?? '',
    salary: staff.salary != null ? String(staff.salary) : '',
    qualification: staff.qualification ?? '',
    experienceYears: String(staff.experienceYears ?? 0),
    experienceMonths: String(staff.experienceMonths ?? 0),
    joiningDate: staff.joiningDate ? String(staff.joiningDate).slice(0, 10) : '',
    isActive: staff.isActive ?? true,
  }
}

export function staffFormToPayload(form) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    username: form.username.trim() || undefined,
    gender: form.gender,
    customRoleId: form.customRoleId,
    designation: form.designation.trim(),
    salary: Number(form.salary),
    qualification: form.qualification.trim(),
    experienceYears: Number(form.experienceYears || 0),
    experienceMonths: Number(form.experienceMonths || 0),
    joiningDate: form.joiningDate,
  }
}

const isWhole = (value, min, max = Infinity) => {
  const n = Number(value)
  return value !== '' && Number.isInteger(n) && n >= min && n <= max
}

export function validateStaffForm(form) {
  const errors = {}
  const name = form.name.trim()
  const email = form.email.trim()
  const username = form.username.trim()

  if (name.length < NAME_MIN || name.length > NAME_MAX) errors.name = `Name must be ${NAME_MIN}-${NAME_MAX} characters.`
  if (!email) errors.email = 'Email is required for login account.'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.'
  if (!PHONE_PATTERN.test(form.phone.trim())) errors.phone = 'Phone must be 10-15 characters (digits).'
  if (username && !USERNAME_PATTERN.test(username)) errors.username = 'Username: 3-30 characters, start with a letter, only letters/digits/dot/underscore.'
  if (!form.gender) errors.gender = 'Select a gender.'
  if (!form.customRoleId) errors.customRoleId = 'Select a role.'
  if (form.salary === '' || Number.isNaN(Number(form.salary)) || Number(form.salary) < 0) errors.salary = 'Enter a valid salary.'
  if (!form.qualification.trim()) errors.qualification = 'Enter a qualification.'
  if (!isWhole(form.experienceYears || '0', 0, 60)) errors.experienceYears = 'Years must be a whole number (0-60).'
  if (!isWhole(form.experienceMonths || '0', 0, 11)) errors.experienceMonths = 'Months must be 0-11.'
  if (!form.joiningDate) errors.joiningDate = 'Enter the joining date.'

  return errors
}
