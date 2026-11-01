import { httpClient } from '../../../api/httpClient.js'

const unwrap = (res) => res.data.data

export const rolePermissionsApi = {
  list() {
    return httpClient.get('/admin/permissions/roles').then(unwrap)
  },

  get(roleId) {
    return httpClient.get(`/admin/permissions/roles/${roleId}`).then(unwrap)
  },

  patch(roleId, permissions) {
    return httpClient.patch(`/admin/permissions/roles/${roleId}`, { permissions }).then(unwrap)
  },

  put(roleId, permissions) {
    return httpClient.put(`/admin/permissions/roles/${roleId}`, { permissions }).then(unwrap)
  },

  getSchoolPermissions() {
    return httpClient.get('/admin/permissions/school').then(unwrap)
  },
}
