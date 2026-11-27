import { httpClient } from '../../../api/httpClient.js'
import { cleanParams } from '../../../utils/format.js'

/**
 * @param {string} schoolId
 * @param {Object} params
 * @param {'students'|'teachers'|'staff'} params.type
 * @param {number} [params.page]
 * @param {number} [params.pageSize]
 * @param {string} [params.search]
 * @param {'ACTIVE'|'INACTIVE'|'ALL'} [params.status]
 * @param {string} [params.classId]
 * @param {string} [params.sectionId]
 * @param {string} [params.subject]
 * @param {string} [params.designation]
 * @param {string} [params.customRoleId]
 * @returns {Promise<import('./schoolUsers.types.js').SchoolUsersResult>}
 */
export function fetchSchoolUsers(schoolId, params) {
  return httpClient
    .get(`/super-admin/schools/${schoolId}/users`, { params: cleanParams(params) })
    .then((res) => res.data.data)
}
