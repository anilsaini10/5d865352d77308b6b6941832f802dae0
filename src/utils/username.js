export const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9._]{2,29}$/

export function validateUsername(value) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length < 3 || trimmed.length > 30) return 'Username must be 3-30 characters.'
  if (!/^[a-zA-Z]/.test(trimmed)) return 'Username must start with a letter.'
  if (!USERNAME_PATTERN.test(trimmed)) return 'Only letters, digits, dots and underscores.'
  return null
}
