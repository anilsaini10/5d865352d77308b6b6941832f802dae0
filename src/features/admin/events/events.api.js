import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} SchoolEvent
 * @property {string} id
 * @property {string} title
 * @property {string|null} description
 * @property {'HOLIDAY'|'EXAM'|'MEETING'|'ACTIVITY'|'OTHER'} eventType
 * @property {'ALL'|'TEACHER'|'PARENT'} audience
 * @property {string} startDate
 * @property {string} endDate
 * @property {{id:string, name:string}} createdBy
 */

export const eventsApi = {
  /** from / to: "YYYY-MM-DD" date bounds. */
  list({ page = 1, pageSize = 20, search, eventType, audience, from, to } = {}) {
    return httpClient
      .get('/admin/events', { params: params({ page, pageSize, search, eventType, audience, from, to }) })
      .then(unwrap)
      .then(normalizePage)
  },

  get(id) {
    return httpClient.get(`/admin/events/${id}`).then(unwrap)
  },

  /** Sends push + in-app notifications. endDate defaults to startDate. */
  create(body) {
    return httpClient.post('/admin/events', body).then(unwrap)
  },

  update(id, body) {
    return httpClient.patch(`/admin/events/${id}`, body).then(unwrap)
  },

  remove(id) {
    return httpClient.delete(`/admin/events/${id}`).then(unwrap)
  },
}
