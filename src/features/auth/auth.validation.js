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
  if (!identifier?.trim()) errors.identifier = 'Email or phone is required.'
  if (!password) errors.password = 'Password is required.'
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
