import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

export const admissionsApi = {
  list({ page = 1, pageSize = 15, search, status, classId, academicSessionId } = {}) {
    return httpClient
      .get('/admin/admissions', { params: params({ page, pageSize, search, status, classId, academicSessionId }) })
      .then(unwrap)
      .then(normalizePage)
  },

  get(id) {
    return httpClient.get(`/admin/admissions/${id}`).then(unwrap)
  },

  create(body) {
    return httpClient.post('/admin/admissions', body).then(unwrap)
  },

  update(id, body) {
    return httpClient.patch(`/admin/admissions/${id}`, body).then(unwrap)
  },

  enroll(id, body) {
    return httpClient.post(`/admin/admissions/${id}/enroll`, body).then(unwrap)
  },

  stats(academicSessionId) {
    return httpClient.get('/admin/admissions/stats', { params: params({ academicSessionId }) }).then(unwrap)
  },

  remove(id) {
    return httpClient.delete(`/admin/admissions/${id}`).then(unwrap)
  },
}
