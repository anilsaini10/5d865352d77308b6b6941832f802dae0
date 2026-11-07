const ACCESS_TOKEN_KEY = 'sa_access_token'
const REFRESH_TOKEN_KEY = 'sa_refresh_token'
const USER_KEY = 'sa_user'
const PERMISSIONS_KEY = 'arise.permissions'

export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  setTokens({ accessToken, refreshToken }) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  setAccessToken(accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  getPermissionCache() {
    try {
      const raw = localStorage.getItem(PERMISSIONS_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      localStorage.removeItem(PERMISSIONS_KEY)
      return null
    }
  },
  setPermissionCache(data) {
    try {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(data))
    } catch { /* quota exceeded — non-critical */ }
  },
  clearPermissionCache() {
    localStorage.removeItem(PERMISSIONS_KEY)
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PERMISSIONS_KEY)
  },
}
