import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage } from '../../../api/apiHelpers.js'
import { cleanParams } from '../../../utils/format.js'

export const roleAccountsApi = {
  listRoles() {
    return httpClient.get('/admin/roles').then(unwrap)
  },

  list({ customRoleId, status, search, page = 1, pageSize = 20 } = {}) {
    return httpClient
      .get('/admin/role-users', { params: cleanParams({ customRoleId, status, search, page, pageSize }) })
      .then(unwrap)
      .then(normalizePage)
  },

  get(userId) {
    return httpClient.get(`/admin/role-users/${userId}`).then(unwrap)
  },

  create(body) {
    return httpClient.post('/admin/role-users', body).then((res) => res.data.data)
  },

  update(userId, body) {
    return httpClient.patch(`/admin/role-users/${userId}`, body).then(unwrap)
  },
}
