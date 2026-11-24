import { httpClient } from '../../../api/httpClient.js'
import { unwrap } from '../../../api/apiHelpers.js'

export const academicSessionsApi = {
  list() {
    return httpClient.get('/admin/academic-sessions').then(unwrap)
  },

  getCurrent() {
    return httpClient.get('/admin/academic-sessions/current').then(unwrap)
  },

  create(body) {
    return httpClient.post('/admin/academic-sessions', body).then(unwrap)
  },

  update(id, body) {
    return httpClient.patch(`/admin/academic-sessions/${id}`, body).then(unwrap)
  },

  remove(id) {
    return httpClient.delete(`/admin/academic-sessions/${id}`).then(unwrap)
  },
}
