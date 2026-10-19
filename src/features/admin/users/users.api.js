import { httpClient } from '../../../api/httpClient.js'
import { unwrap } from '../../../api/apiHelpers.js'

export const usersApi = {
  /**
   * Resets a teacher's (`teacher.userId`) or parent's (`student.parentUserId`) password to the default
   * and logs them out everywhere. 404 USER_NOT_FOUND for anyone else (other admins, other schools).
   * @returns {Promise<{message:string, userId:string, name:string, role:string, defaultPassword:string}>}
   */
  resetPassword(userId) {
    return httpClient.post(`/admin/users/${userId}/reset-password`).then(unwrap)
  },
}
