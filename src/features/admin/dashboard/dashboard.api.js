import { httpClient } from '../../../api/httpClient.js'
import { unwrap } from '../../../api/apiHelpers.js'

export const adminDashboardApi = {
  /** @returns {Promise<{studentsCount:number, teachersCount:number, staffCount:number, classesCount:number}>} */
  get() {
    return httpClient.get('/admin/dashboard').then(unwrap)
  },
}
