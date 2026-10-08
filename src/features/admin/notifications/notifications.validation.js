export const NOTIFICATION_TITLE_MAX = 200

/** `data` is [{ key, value }] rows; empty rows are ignored. */
export function validateSendNotificationForm({ userId, title, body, data = [] }) {
  const errors = {}

  if (!userId?.trim()) errors.userId = 'Recipient user ID is required.'

  const trimmedTitle = title?.trim() ?? ''
  if (!trimmedTitle) errors.title = 'Title is required.'
  else if (trimmedTitle.length > NOTIFICATION_TITLE_MAX) errors.title = `Title must be at most ${NOTIFICATION_TITLE_MAX} characters.`

  if (!body?.trim()) errors.body = 'Message is required.'

  const seen = new Set()
  data.forEach((row, i) => {
    const key = row.key.trim()
    const value = row.value.trim()
    if (!key && !value) return
    if (!key) errors[`data.${i}`] = 'Key is required.'
    else if (seen.has(key)) errors[`data.${i}`] = 'Duplicate key.'
    seen.add(key)
  })

  return errors
}
