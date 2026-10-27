import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} RecoveryRequest
 * @property {string} id
 * @property {'PENDING'|'RESOLVED'|'REJECTED'} status
 * @property {{ name: string, email: string|null, phones: string[] }} submitted
 * @property {{ id: string, name: string, role: 'TEACHER'|'PARENT', email: string|null, phone: string|null, username: string|null, isActive: boolean }} account
 * @property {{ id: string, name: string }|null} resolvedBy
 * @property {string|null} resolvedAt
 * @property {string} createdAt
 * @property {string} updatedAt bumps when the user re-submits
 */

// Reset / reject are one-shot and take no body: a second call returns 409 RECOVERY_REQUEST_NOT_PENDING.
export const recoveryApi = {
  /** Returns the page plus `statusCounts: { PENDING, RESOLVED, REJECTED }`. */
  list({ status, search, page, pageSize } = {}) {
    return httpClient.get('/admin/account-recovery/requests', { params: params({ status, search, page, pageSize }) }).then((res) => normalizePage(unwrap(res)))
  },

  get(requestId) {
    return httpClient.get(`/admin/account-recovery/requests/${requestId}`).then(unwrap)
  },

  /** Sets the account's password to the default and logs it out everywhere. Response also has `defaultPassword`. */
  reset(requestId) {
    return httpClient.post(`/admin/account-recovery/requests/${requestId}/reset`).then(unwrap)
  },

  reject(requestId) {
    return httpClient.post(`/admin/account-recovery/requests/${requestId}/reject`).then(unwrap)
  },
}
