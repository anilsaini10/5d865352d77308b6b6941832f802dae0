export const ANNOUNCEMENT_TITLE_MAX = 200

export function validateAnnouncementForm({ title, message, publishAt, expiresAt }) {
  const errors = {}
  const trimmedTitle = title?.trim() ?? ''

  if (!trimmedTitle) errors.title = 'Title is required.'
  else if (trimmedTitle.length > ANNOUNCEMENT_TITLE_MAX) errors.title = `Title must be at most ${ANNOUNCEMENT_TITLE_MAX} characters.`

  if (!message?.trim()) errors.message = 'Message is required.'

  if (publishAt && expiresAt && new Date(expiresAt) <= new Date(publishAt)) {
    errors.expiresAt = 'Expiry must be after the publish time.'
  } else if (!publishAt && expiresAt && new Date(expiresAt) <= new Date()) {
    errors.expiresAt = 'Expiry must be in the future.'
  }

  return errors
}
