import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} Staff
 * @property {string} id
 * @property {string} employeeId
 * @property {string|null} userId
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string|null} username
 * @property {'MALE'|'FEMALE'|'OTHER'} gender
 * @property {string} designation
 * @property {string} customRoleId
 * @property {{id:string, key:string, name:string}|null} customRole
 * @property {number} salary
 * @property {string} qualification
 * @property {number} experienceYears
 * @property {number} experienceMonths
 * @property {string} joiningDate
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const staffApi = {
  /** Unlike students/teachers, omitting status returns EVERYONE — pass 'ACTIVE' explicitly for active only. */
  list({ page = 1, pageSize = 15, search, customRoleId, status } = {}) {
    return httpClient
      .get('/admin/staff', { params: params({ page, pageSize, search, customRoleId, status }) })
      .then(unwrap)
      .then(normalizePage)
  },

  get(staffId) {
    return httpClient.get(`/admin/staff/${staffId}`).then(unwrap)
  },

  /** @returns {Promise<{staff: Staff, defaultPassword: string}>} */
  create(body) {
    return httpClient.post('/admin/staff', body).then(unwrap)
  },

  update(staffId, body) {
    return httpClient.patch(`/admin/staff/${staffId}`, body).then(unwrap)
  },

  /** HARD delete — staff row removed, linked user account deactivated (login disabled). */
  remove(staffId) {
    return httpClient.delete(`/admin/staff/${staffId}`).then(unwrap)
  },
}
