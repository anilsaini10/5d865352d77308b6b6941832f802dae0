import { httpClient } from '../../../api/httpClient.js'
import { unwrap } from '../../../api/apiHelpers.js'

export const subjectsApi = {
  /** All subjects for the school, unpaginated. */
  list() {
    return httpClient.get('/subjects').then(unwrap)
  },

  /** body: { name, classIds?: string[] } */
  create(body) {
    return httpClient.post('/subjects', body).then(unwrap)
  },
}
