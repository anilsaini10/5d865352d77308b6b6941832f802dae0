import { validateUsername } from '../../utils/username.js'

export const ADMIN_NAME_MIN = 2
export const ADMIN_NAME_MAX = 100
export const ADMIN_EMAIL_PATTERN = /^\S+@\S+\.\S+$/
export const ADMIN_PHONE_PATTERN = /^\d{10,15}$/

export function validateAdminForm({ name, email, phone, username }) {
  const errors = {}
  const trimmedName = name?.trim() ?? ''
  const trimmedEmail = email?.trim() ?? ''
  const trimmedPhone = phone?.trim() ?? ''

  if (trimmedName.length < ADMIN_NAME_MIN || trimmedName.length > ADMIN_NAME_MAX) {
    errors.name = `Name must be ${ADMIN_NAME_MIN}-${ADMIN_NAME_MAX} characters.`
  }
  if (!ADMIN_EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.'
  }
  if (trimmedPhone && !ADMIN_PHONE_PATTERN.test(trimmedPhone)) {
    errors.phone = 'Phone must be 10-15 digits.'
  }
  const usernameError = validateUsername(username)
  if (usernameError) errors.username = usernameError

  return errors
}
