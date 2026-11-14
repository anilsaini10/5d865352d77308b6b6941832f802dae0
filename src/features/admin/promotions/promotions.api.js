import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

export const promotionsApi = {
  preview(body) {
    return httpClient.post('/admin/promotions/preview', body).then(unwrap)
  },

  execute(body) {
    return httpClient.post('/admin/promotions/execute', body).then(unwrap)
  },

  history({ page = 1, pageSize = 15, academicSessionId } = {}) {
    return httpClient
      .get('/admin/promotions/history', { params: params({ page, pageSize, academicSessionId }) })
      .then(unwrap)
      .then(normalizePage)
  },

  historyDetail(batchId) {
    return httpClient.get(`/admin/promotions/history/${batchId}`).then(unwrap)
  },

  rollback(batchId) {
    return httpClient.post(`/admin/promotions/rollback/${batchId}`).then(unwrap)
  },
}
