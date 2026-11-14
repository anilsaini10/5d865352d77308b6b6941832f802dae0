import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

export const feesApi = {
  list({ page = 1, pageSize = 15, search, classId, status } = {}) {
    return httpClient
      .get('/admin/fees', { params: params({ page, pageSize, search, classId, status }) })
      .then(unwrap)
      .then(normalizePage)
  },

  collect(body) {
    return httpClient.post('/admin/fees/collect', body).then(unwrap)
  },

  getStudentFees(studentId) {
    return httpClient.get(`/admin/fees/student/${studentId}`).then(unwrap)
  },

  sendReminder({ studentIds, title, description }) {
    return httpClient.post('/admin/fees/reminder', { studentIds, title, description }).then(unwrap)
  },
}
