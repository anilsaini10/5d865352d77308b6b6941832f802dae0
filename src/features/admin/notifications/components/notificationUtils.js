import { formatDate, titleCase } from '../../../../utils/format.js'

// The inbox item shape isn't pinned down by the API, so read it defensively.
export const notificationTitle = (n) => n?.title || n?.subject || titleCase(n?.type) || 'Notification'
export const notificationBody = (n) => n?.body || n?.message || n?.content || ''
export const notificationTime = (n) => n?.createdAt || n?.sentAt || n?.updatedAt
export const isUnread = (n) => !(n?.isRead ?? n?.read ?? !!n?.readAt)

export function timeAgo(value) {
  if (!value) return ''
  const diff = (Date.now() - new Date(value).getTime()) / 1000
  if (Number.isNaN(diff)) return ''
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(value)
}

/** Lets the bell and the inbox page keep each other's unread state in sync. */
export const NOTIFICATIONS_CHANGED = 'notifications:changed'
export const announceNotificationsChanged = (source) =>
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED, { detail: { source } }))
