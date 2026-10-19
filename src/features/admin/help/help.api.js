import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} SupportQuery
 * @property {string} id
 * @property {string} subject
 * @property {string|null} category
 * @property {string} message  sanitized HTML
 * @property {'OPEN'|'IN_PROGRESS'|'RESOLVED'|'CLOSED'} status
 * @property {string|null} reply  sanitized HTML from support
 * @property {string|null} repliedAt
 * @property {string} createdAt
 */
export const helpApi = {
  /** body: { subject, category?, message (HTML) } — 400 VALIDATION_ERROR, 429 TOO_MANY_REQUESTS (details.retryAfterSeconds) */
  create(body) {
    return httpClient.post('/admin/support/queries', body).then(unwrap)
  },

  /** Only this admin's own queries, newest first. @returns {Promise<{items: SupportQuery[], page:number, total:number, totalPages:number}>} */
  list({ page = 1, pageSize = 10, status } = {}) {
    return httpClient.get('/admin/support/queries', { params: params({ page, pageSize, status }) }).then(unwrap).then(normalizePage)
  },

  /** 404 SUPPORT_QUERY_NOT_FOUND */
  get(queryId) {
    return httpClient.get(`/admin/support/queries/${queryId}`).then(unwrap)
  },
}
