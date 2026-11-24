export const PASSWORD_MIN = 6
export const PASSWORD_MAX = 100
export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
export const OTP_PATTERN = /^\d{6}$/

function validateNewPassword(newPassword, confirmPassword) {
  const errors = {}
  if (!newPassword || newPassword.length < PASSWORD_MIN || newPassword.length > PASSWORD_MAX) {
    errors.newPassword = `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters.`
  }
  if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  return errors
}

export function validateLoginForm({ identifier, password }) {
  const errors = {}
  if (!identifier?.trim()) errors.identifier = 'Enter your email, username or mobile number.'
  if (!password) errors.password = 'Password is required.'
  return errors
}

const PHONE_PATTERN = /^\d{10}$/

export function validateSignupForm({ name, email, phone, password, confirmPassword, schoolName }) {
  const errors = {}
  if (!name?.trim()) errors.name = 'Enter your name.'
  if (!EMAIL_PATTERN.test(email?.trim() ?? '')) errors.email = 'Enter a valid email address.'
  if (!PHONE_PATTERN.test(phone?.trim() ?? '')) errors.phone = 'Enter a valid 10-digit mobile number.'
  if (!password || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    errors.password = `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters.`
  }
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'
  if (!schoolName?.trim()) errors.schoolName = 'Enter your school name.'
  return errors
}

export function validateChangePasswordForm({ currentPassword, newPassword, confirmPassword }) {
  const errors = {}
  if (!currentPassword) errors.currentPassword = 'Current password is required.'
  return { ...errors, ...validateNewPassword(newPassword, confirmPassword) }
}

export function validateForgotPasswordForm({ email }) {
  const errors = {}
  if (!EMAIL_PATTERN.test(email?.trim() ?? '')) errors.email = 'Enter a valid email address.'
  return errors
}

export function validateResetConfirmForm({ otp, newPassword, confirmPassword }) {
  const errors = {}
  if (!OTP_PATTERN.test(otp?.trim() ?? '')) errors.otp = 'Enter the 6-digit code.'
  return { ...errors, ...validateNewPassword(newPassword, confirmPassword) }
}
