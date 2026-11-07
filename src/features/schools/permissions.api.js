import { httpClient } from '../../api/httpClient.js'

const unwrap = (res) => res.data.data

export const schoolPermissionsApi = {
  get(schoolId) {
    return httpClient.get(`/super-admin/schools/${schoolId}/permissions`).then(unwrap)
  },

  patch(schoolId, permissions) {
    return httpClient.patch(`/super-admin/schools/${schoolId}/permissions`, { permissions }).then(unwrap)
  },

  put(schoolId, permissions) {
    return httpClient.put(`/super-admin/schools/${schoolId}/permissions`, { permissions }).then(unwrap)
  },

  getRolePermissions(schoolId) {
    return httpClient.get(`/super-admin/schools/${schoolId}/role-permissions`).then(unwrap)
  },

  getRolePermission(schoolId, roleId) {
    return httpClient.get(`/super-admin/schools/${schoolId}/role-permissions/${roleId}`).then(unwrap)
  },

  putRolePermission(schoolId, roleId, permissions) {
    return httpClient.put(`/super-admin/schools/${schoolId}/role-permissions/${roleId}`, { permissions }).then(unwrap)
  },

  patchRolePermission(schoolId, roleId, permissions) {
    return httpClient.patch(`/super-admin/schools/${schoolId}/role-permissions/${roleId}`, { permissions }).then(unwrap)
  },
}
