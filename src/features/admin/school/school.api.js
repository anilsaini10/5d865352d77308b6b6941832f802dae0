import { httpClient } from '../../../api/httpClient.js'
import { unwrap } from '../../../api/apiHelpers.js'

export const schoolApi = {
  /** @returns {Promise<import('../../schools/schools.types.js').School>} */
  get() {
    return httpClient.get('/admin/school').then(unwrap)
  },

  /** Changed fields only. `code` is read-only. Latitude/longitude always go together (both null clears). */
  update(body) {
    return httpClient.patch('/admin/school', body).then(unwrap)
  },
}
