import { httpClient } from '../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../api/apiHelpers.js'

/**
 * @typedef {Object} InboxQuery
 * @property {string} id
 * @property {string} subject
 * @property {string|null} category
 * @property {string} message  sanitized HTML
 * @property {'OPEN'|'IN_PROGRESS'|'RESOLVED'|'CLOSED'} status
 * @property {string|null} reply
 * @property {string|null} repliedAt
 * @property {string} createdAt
 * @property {string} schoolId
 * @property {string} schoolName
 * @property {{id:string, name:string, role:'ADMIN'|'TEACHER'|'PARENT', email:string, phone:string|null}} createdBy
 * @property {{id:string, name:string}|null} repliedBy
 */

export const supportInboxApi = {
  /**
   * `statusCounts` are totals across ALL queries — they ignore the filters.
   * @returns {Promise<{items: InboxQuery[], page:number, pageSize:number, total:number, totalPages:number,
   *   statusCounts: {OPEN:number, IN_PROGRESS:number, RESOLVED:number, CLOSED:number}}>}
   */
  list({ page = 1, pageSize = 20, status, schoolId, role, category, search } = {}) {
    return httpClient
      .get('/super-admin/support/queries', { params: params({ page, pageSize, status, schoolId, role, category, search }) })
      .then(unwrap)
      .then(normalizePage)
  },

  /** 404 SUPPORT_QUERY_NOT_FOUND @returns {Promise<InboxQuery>} */
  get(queryId) {
    return httpClient.get(`/super-admin/support/queries/${queryId}`).then(unwrap)
  },

  /** body: { status?, reply? } (at least one). `reply: null` clears it. repliedAt/repliedBy only move when the reply text changes. */
  update(queryId, body) {
    return httpClient.patch(`/super-admin/support/queries/${queryId}`, body).then(unwrap)
  },
}
