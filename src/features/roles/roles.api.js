import { httpClient } from '../../api/httpClient.js'
import { unwrap } from '../../api/apiHelpers.js'
import { cleanParams } from '../../utils/format.js'

export const rolesApi = {
  list({ status, search } = {}) {
    return httpClient
      .get('/super-admin/roles', { params: cleanParams({ status, search }) })
      .then(unwrap)
  },

  get(roleId) {
    return httpClient.get(`/super-admin/roles/${roleId}`).then(unwrap)
  },

  create(body) {
    return httpClient.post('/super-admin/roles', body).then(unwrap)
  },

  update(roleId, body) {
    return httpClient.patch(`/super-admin/roles/${roleId}`, body).then(unwrap)
  },

  remove(roleId) {
    return httpClient.delete(`/super-admin/roles/${roleId}`).then(unwrap)
  },
}
