import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

const base = '/admin/interventions'

export const interventionsApi = {
  list(q) {
    return httpClient.get(base, { params: params(q ?? {}) }).then(unwrap).then(normalizePage)
  },
  get(id) {
    return httpClient.get(`${base}/${id}`).then(unwrap)
  },
  create(body) {
    return httpClient.post(base, body).then(unwrap)
  },
  update(id, body) {
    return httpClient.patch(`${base}/${id}`, body).then(unwrap)
  },
}
