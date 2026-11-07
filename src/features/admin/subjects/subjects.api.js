import { httpClient } from '../../../api/httpClient.js'
import { unwrap } from '../../../api/apiHelpers.js'

export const subjectsApi = {
  list() {
    return httpClient.get('/subjects').then(unwrap)
  },

  get(subjectId) {
    return httpClient.get(`/subjects/${subjectId}`).then(unwrap)
  },

  create(body) {
    return httpClient.post('/subjects', body).then(unwrap)
  },

  update(subjectId, body) {
    return httpClient.patch(`/subjects/${subjectId}`, body).then(unwrap)
  },

  remove(subjectId) {
    return httpClient.delete(`/subjects/${subjectId}`).then(unwrap)
  },

  toggleStatus(subjectId) {
    return httpClient.patch(`/subjects/${subjectId}/status`).then(unwrap)
  },

  assignClasses(subjectId, classIds) {
    return httpClient.post(`/subjects/${subjectId}/classes`, { classIds }).then(unwrap)
  },

  byClass(classId) {
    return httpClient.get(`/subjects/by-class/${classId}`).then(unwrap)
  },
}
