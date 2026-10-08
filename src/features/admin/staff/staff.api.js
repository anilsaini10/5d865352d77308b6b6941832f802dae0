import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} Staff
 * @property {string} id
 * @property {string} employeeId
 * @property {string} name
 * @property {string|null} email
 * @property {string} phone
 * @property {'MALE'|'FEMALE'|'OTHER'} gender
 * @property {string} designation
 * @property {number} salary
 * @property {string} qualification
 * @property {number} experienceYears
 * @property {number} experienceMonths
 * @property {string} joiningDate
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const staffApi = {
  /** Unlike students/teachers, omitting status returns EVERYONE — pass 'ACTIVE' explicitly for active only. */
  list({ page = 1, pageSize = 15, search, designation, status } = {}) {
    return httpClient
      .get('/admin/staff', { params: params({ page, pageSize, search, designation, status }) })
      .then(unwrap)
      .then(normalizePage)
  },

  get(staffId) {
    return httpClient.get(`/admin/staff/${staffId}`).then(unwrap)
  },

  /** No login account is created for staff — no default password in the response. */
  create(body) {
    return httpClient.post('/admin/staff', body).then(unwrap)
  },

  update(staffId, body) {
    return httpClient.patch(`/admin/staff/${staffId}`, body).then(unwrap)
  },

  /** HARD delete — the row is permanently removed. */
  remove(staffId) {
    return httpClient.delete(`/admin/staff/${staffId}`).then(unwrap)
  },
}
