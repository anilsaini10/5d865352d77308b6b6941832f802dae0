import { httpClient } from '../../api/httpClient.js'

export const authApi = {
  /** @returns {Promise<import('./auth.types.js').LoginResult>} */
  login(identifier, password, role, schoolId) {
    const body = { identifier, password, role }
    if (schoolId) body.schoolId = schoolId
    return httpClient
      .post('/auth/login', body)
      .then((res) => res.data.data)
  },

  searchSchools(search) {
    return httpClient
      .get('/auth/schools', { params: { search: search || undefined } })
      .then((res) => res.data.data)
  },

  logout(refreshToken) {
    return httpClient.post('/auth/logout', { refreshToken }).then((res) => res.data.data)
  },

  resetPassword(currentPassword, newPassword) {
    return httpClient
      .post('/auth/reset-password', { currentPassword, newPassword })
      .then((res) => res.data.data)
  },

  forgotPassword(email) {
    return httpClient.post('/auth/forgot-password', { email }).then((res) => res.data.data)
  },

  confirmResetPassword({ email, otp, newPassword }) {
    return httpClient
      .post('/auth/reset-password/confirm', { email, otp, newPassword })
      .then((res) => res.data.data)
  },

  updateUsername(username) {
    return httpClient
      .patch('/auth/username', { username })
      .then((res) => res.data.data)
  },

  getPermissions() {
    return httpClient.get('/auth/permissions').then((res) => res.data.data)
  },
}
