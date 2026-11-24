import { httpClient } from '../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../api/apiHelpers.js'

export const crashReportsApi = {
  stats() {
    return httpClient.get('/super-admin/crash-reports/stats').then(unwrap)
  },

  list({ page = 1, pageSize = 20, platform, isFatal, search } = {}) {
    return httpClient
      .get('/super-admin/crash-reports', { params: params({ page, pageSize, platform, isFatal, search }) })
      .then(unwrap)
      .then(normalizePage)
  },

  get(id) {
    return httpClient.get(`/super-admin/crash-reports/${id}`).then(unwrap)
  },
}
