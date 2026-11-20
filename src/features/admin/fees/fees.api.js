import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

export const feesApi = {
  listStudentFees({ page = 1, pageSize = 15, search, classId, sectionId, status, category, studentId, sessionYear } = {}) {
    return httpClient
      .get('/admin/fees/student-fees', { params: params({ page, pageSize, search, classId, sectionId, status, category, studentId, sessionYear }) })
      .then(unwrap)
      .then((payload) => {
        const { totals, ...rest } = payload
        return { ...normalizePage(rest), totals }
      })
  },

  summary({ sessionYear, classId } = {}) {
    return httpClient.get('/admin/fees/summary', { params: params({ sessionYear, classId }) }).then(unwrap)
  },

  defaulters({ page = 1, pageSize = 15, search, classId, sectionId, sessionYear, overdueOnly } = {}) {
    return httpClient
      .get('/admin/fees/defaulters', { params: params({ page, pageSize, search, classId, sectionId, sessionYear, overdueOnly }) })
      .then(unwrap)
      .then(normalizePage)
  },

  getStudentLedger(studentId, { sessionYear } = {}) {
    return httpClient.get(`/admin/fees/students/${studentId}`, { params: params({ sessionYear }) }).then(unwrap)
  },

  recordPayment(feeId, body) {
    return httpClient.post(`/admin/fees/student-fees/${feeId}/payments`, body).then(unwrap)
  },

  listPayments({ page = 1, pageSize = 15, search, classId, studentId, from, to, mode, status } = {}) {
    return httpClient
      .get('/admin/fees/payments', { params: params({ page, pageSize, search, classId, studentId, from, to, mode, status }) })
      .then(unwrap)
      .then(normalizePage)
  },
}
