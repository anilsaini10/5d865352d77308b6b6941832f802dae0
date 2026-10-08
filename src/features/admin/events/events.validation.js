export const EVENT_TITLE_MAX = 200

export function validateEventForm({ title, eventType, startDate, endDate }) {
  const errors = {}
  const trimmedTitle = title?.trim() ?? ''

  if (!trimmedTitle) errors.title = 'Title is required.'
  else if (trimmedTitle.length > EVENT_TITLE_MAX) errors.title = `Title must be at most ${EVENT_TITLE_MAX} characters.`

  if (!eventType) errors.eventType = 'Select an event type.'
  if (!startDate) errors.startDate = 'Start date is required.'
  if (startDate && endDate && endDate < startDate) errors.endDate = 'End date cannot be before the start date.'

  return errors
}
