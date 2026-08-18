import { httpClient } from '../../api/httpClient.js'

export const schoolsApi = {
  /** @returns {Promise<import('./schools.types.js').SchoolListResult>} */
  list({ page = 1, pageSize = 20, search = '' } = {}) {
    return httpClient
      .get('/super-admin/schools', { params: { page, pageSize, search: search || undefined } })
      .then((res) => res.data.data)
  },

  /** @returns {Promise<import('./schools.types.js').School>} */
  getById(schoolId) {
    return httpClient.get(`/super-admin/schools/${schoolId}`).then((res) => res.data.data)
  },

  /** @returns {Promise<import('./schools.types.js').CreateSchoolResult>} */
  create(payload) {
    return httpClient.post('/super-admin/schools', payload).then((res) => res.data.data)
  },

  /** @returns {Promise<import('./schools.types.js').School>} */
  update(schoolId, payload) {
    return httpClient.patch(`/super-admin/schools/${schoolId}`, payload).then((res) => res.data.data)
  },
}
