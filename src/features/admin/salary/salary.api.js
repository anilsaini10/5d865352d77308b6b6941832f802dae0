import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

export const salaryApi = {
  list({ page = 1, pageSize = 15, search, month, year, status } = {}) {
    return httpClient
      .get('/admin/salary', { params: params({ page, pageSize, search, month, year, status }) })
      .then(unwrap)
      .then(normalizePage)
  },

  generate({ month, year }) {
    return httpClient.post('/admin/salary/generate', { month, year }).then(unwrap)
  },

  getDetail(salaryId) {
    return httpClient.get(`/admin/salary/${salaryId}`).then(unwrap)
  },

  getTeacherSalary(teacherId, { month, year } = {}) {
    return httpClient
      .get(`/admin/salary/teacher/${teacherId}`, { params: params({ month, year }) })
      .then(unwrap)
  },
}
