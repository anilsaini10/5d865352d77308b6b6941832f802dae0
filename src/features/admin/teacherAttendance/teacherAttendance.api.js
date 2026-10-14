import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

export const teacherAttendanceApi = {
  /** body: { date: "YYYY-MM-DD", records: [{ teacherId, status }] } */
  markBulk(body) {
    return httpClient.post('/admin/teacher-attendance', body).then(unwrap)
  },

  /**
   * Pass either `date` OR `from`/`to`, never both. `status` filters the FINAL status;
   * `teacherStatus` / `adminStatus` filter each side (null values can't be filtered).
   */
  list({ page = 1, pageSize = 20, date, from, to, status, teacherStatus, adminStatus, teacherId } = {}) {
    return httpClient
      .get('/admin/teacher-attendance', { params: params({ page, pageSize, date, from, to, status, teacherStatus, adminStatus, teacherId }) })
      .then(unwrap)
      .then(normalizePage)
  },

  /** Changes the admin status (and so the final status); the teacher's check-in is untouched. */
  update(recordId, status) {
    return httpClient.patch(`/admin/teacher-attendance/${recordId}`, { status }).then(unwrap)
  },
}
