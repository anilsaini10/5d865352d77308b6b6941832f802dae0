import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

export const teacherAttendanceApi = {
  /** body: { date: "YYYY-MM-DD", records: [{ teacherId, status }] } */
  markBulk(body) {
    return httpClient.post('/admin/teacher-attendance', body).then(unwrap)
  },

  /** Pass either `date` OR `from`/`to`, never both. */
  list({ page = 1, pageSize = 20, date, from, to, status, teacherId } = {}) {
    return httpClient
      .get('/admin/teacher-attendance', { params: params({ page, pageSize, date, from, to, status, teacherId }) })
      .then(unwrap)
      .then(normalizePage)
  },

  update(recordId, status) {
    return httpClient.patch(`/admin/teacher-attendance/${recordId}`, { status }).then(unwrap)
  },
}
