import { httpClient } from '../../api/httpClient.js'

export const adminsApi = {
  /** @returns {Promise<import('./admins.types.js').SchoolAdmin[]>} */
  list(schoolId) {
    return httpClient.get(`/super-admin/schools/${schoolId}/admins`).then((res) => res.data.data)
  },

  /** @returns {Promise<import('./admins.types.js').CreateAdminResult>} */
  create(schoolId, { name, email, phone, username }) {
    return httpClient
      .post(`/super-admin/schools/${schoolId}/admins`, {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || undefined,
        username: username?.trim()?.toLowerCase() || undefined,
      })
      .then((res) => res.data.data)
  },

  /** @returns {Promise<import('./admins.types.js').SchoolAdmin>} */
  update(schoolId, adminId, { name, email, phone, username }) {
    const payload = {}
    if (name?.trim()) payload.name = name.trim()
    if (email?.trim()) payload.email = email.trim()
    if (phone?.trim()) payload.phone = phone.trim()
    if (username !== undefined) payload.username = username?.trim()?.toLowerCase() || null
    return httpClient
      .patch(`/super-admin/schools/${schoolId}/admins/${adminId}`, payload)
      .then((res) => res.data.data)
  },

  /** Resets the admin's password to the default and logs them out everywhere. 404 ADMIN_NOT_FOUND. */
  resetPassword(schoolId, adminId) {
    return httpClient.post(`/super-admin/schools/${schoolId}/admins/${adminId}/reset-password`).then((res) => res.data.data)
  },

  /** @returns {Promise<import('./admins.types.js').SchoolAdmin>} */
  setStatus(schoolId, adminId, isActive) {
    return httpClient
      .patch(`/super-admin/schools/${schoolId}/admins/${adminId}/status`, { isActive })
      .then((res) => res.data.data)
  },
}
