import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} Announcement
 * @property {string} id
 * @property {string} title
 * @property {string} message
 * @property {'ALL'|'TEACHER'|'PARENT'} audience
 * @property {string|null} eventDate
 * @property {string|null} publishAt
 * @property {string|null} expiresAt
 * @property {'SCHEDULED'|'ACTIVE'|'EXPIRED'} status  computed server-side
 * @property {{id:string, name:string}} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const announcementsApi = {
  list({ page = 1, pageSize = 15, search, audience } = {}) {
    return httpClient
      .get('/admin/announcements', { params: params({ page, pageSize, search, audience }) })
      .then(unwrap)
      .then(normalizePage)
  },

  get(id) {
    return httpClient.get(`/admin/announcements/${id}`).then(unwrap)
  },

  /** Sends push + in-app notifications (skipped when publishAt is in the future). */
  create(body) {
    return httpClient.post('/admin/announcements', body).then(unwrap)
  },

  /** Re-triggers notifications like create. */
  update(id, body) {
    return httpClient.patch(`/admin/announcements/${id}`, body).then(unwrap)
  },

  remove(id) {
    return httpClient.delete(`/admin/announcements/${id}`).then(unwrap)
  },
}
