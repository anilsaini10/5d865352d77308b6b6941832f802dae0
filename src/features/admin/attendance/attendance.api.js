import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

export const attendanceReportApi = {
  /**
   * date: "YYYY-MM-DD", defaults to today server-side.
   * @returns {Promise<{date:string, classes:{classId:string, className:string, present:number, absent:number, late:number, leave:number, total:number, percentage:number}[]}>}
   */
  classes({ date } = {}) {
    return httpClient.get('/admin/attendance/classes', { params: params({ date }) }).then(unwrap)
  },

  /**
   * status per student is null when not yet marked for that date.
   * @returns {Promise<{date:string, classId:string, className:string, items:{studentId:string, name:string, admissionNo:string, rollNo:number, sectionName:string, status:string|null}[], page:number, total:number, totalPages:number}>}
   */
  classStudents(classId, { date, page = 1, pageSize = 30, search } = {}) {
    return httpClient
      .get(`/admin/attendance/classes/${classId}/students`, { params: params({ date, page, pageSize, search }) })
      .then(unwrap)
      .then(normalizePage)
  },
}
