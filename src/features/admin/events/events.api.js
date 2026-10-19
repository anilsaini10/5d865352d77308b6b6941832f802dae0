import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} SchoolEvent
 * @property {string} id
 * @property {string} title
 * @property {string|null} description
 * @property {'HOLIDAY'|'GOVERNMENT_HOLIDAY'|'VACATION'|'EXAM'|'MEETING'|'ACTIVITY'|'OTHER'} eventType
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

  /**
   * Bulk import (max 500 rows, no push notifications). `dryRun` validates only and returns a per-row report;
   * a real import with any bad row fails with 400 BULK_VALIDATION_FAILED (details.results) and saves nothing.
   * @returns {Promise<{dryRun?:boolean, total?:number, valid?:number, invalid?:number, created:number, results:{index:number, status:string, errors?:string[]}[]}>}
   */
  bulk(rows, { dryRun = false } = {}) {
    return httpClient.post('/admin/events', rows, { params: dryRun ? { dryRun: true } : undefined }).then(unwrap)
  },

  update(id, body) {
    return httpClient.patch(`/admin/events/${id}`, body).then(unwrap)
  },

  remove(id) {
    return httpClient.delete(`/admin/events/${id}`).then(unwrap)
  },
}
