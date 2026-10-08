import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

export const notificationsApi = {
  /** The signed-in user's own inbox. isRead: 'true' | 'false' */
  list({ page = 1, pageSize = 20, isRead, type } = {}) {
    return httpClient.get('/notifications', { params: params({ page, pageSize, isRead, type }) }).then(unwrap).then(normalizePage)
  },

  /** Response shape varies ({ count } or a bare number) — normalised to a number. */
  unreadCount() {
    return httpClient
      .get('/notifications/unread-count')
      .then(unwrap)
      .then((d) => (typeof d === 'number' ? d : d?.count ?? d?.unreadCount ?? 0))
  },

  markRead(id) {
    return httpClient.patch(`/notifications/${id}/read`).then(unwrap)
  },

  markAllRead() {
    return httpClient.patch('/notifications/read-all').then(unwrap)
  },

  /** ADMIN only — manual push to one user. body: { userId, title, body, data? } */
  send(body) {
    return httpClient.post('/notifications/send', body).then(unwrap)
  },
}
