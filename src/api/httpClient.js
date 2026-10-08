import axios from 'axios'
import { tokenStorage } from './tokenStorage.js'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '')

// Shared client used by every feature's api module — carries the auth
// header and silently refreshes an expired access token once.
export const httpClient = axios.create({ baseURL: API_BASE_URL })

// Bare instance for the refresh call itself, so a failed refresh can't
// re-enter the response interceptor below and loop.
const rawClient = axios.create({ baseURL: API_BASE_URL })

let onSessionExpired = null
export function registerSessionExpiredHandler(fn) {
  onSessionExpired = fn
}

httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise = null

function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = tokenStorage.getRefreshToken()
    refreshPromise = (
      refreshToken
        ? rawClient.post('/auth/refresh', { refreshToken }).then((res) => {
            const { accessToken } = res.data.data
            tokenStorage.setAccessToken(accessToken)
            return accessToken
          })
        : Promise.reject(new Error('No refresh token available'))
    ).finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

httpClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error
    const code = response?.data?.error?.code

    if (response?.status === 401 && code === 'UNAUTHORIZED' && config && !config._retried) {
      config._retried = true
      try {
        const accessToken = await refreshAccessToken()
        config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` }
        return httpClient(config)
      } catch {
        tokenStorage.clear()
        onSessionExpired?.()
      }
    }

    return Promise.reject(error)
  }
)

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.error?.message || fallback
}

export function getErrorCode(error) {
  return error?.response?.data?.error?.code
}
