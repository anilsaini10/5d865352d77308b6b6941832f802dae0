import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { authApi } from './auth.api.js'
import { tokenStorage } from '../../api/tokenStorage.js'
import { registerSessionExpiredHandler } from '../../api/httpClient.js'

const AuthContext = createContext(null)

const REFETCH_THROTTLE_MS = 60_000

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [permissions, setPermissions] = useState({})
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const lastFetchRef = useRef(0)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    setPermissions({})
    setIsSuperAdmin(false)
  }, [])

  const fetchPermissions = useCallback(async () => {
    try {
      const data = await authApi.getPermissions()
      setPermissions(data.permissions ?? {})
      setIsSuperAdmin(!!data.isSuperAdmin)
      lastFetchRef.current = Date.now()
    } catch {
      // non-critical — keep whatever we had
    }
  }, [])

  useEffect(() => {
    const storedUser = tokenStorage.getUser()
    const accessToken = tokenStorage.getAccessToken()
    if (storedUser && accessToken) {
      setUser(storedUser)
      fetchPermissions()
    }
    setReady(true)

    registerSessionExpiredHandler(clearSession)
  }, [clearSession, fetchPermissions])

  useEffect(() => {
    if (!user) return undefined
    const onFocus = () => {
      if (Date.now() - lastFetchRef.current > REFETCH_THROTTLE_MS) {
        fetchPermissions()
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user, fetchPermissions])

  const login = useCallback(async (identifier, password, role, schoolId) => {
    const { user: loggedInUser, tokens } = await authApi.login(identifier, password, role, schoolId)
    tokenStorage.setTokens(tokens)
    tokenStorage.setUser(loggedInUser)
    setUser(loggedInUser)
    fetchPermissions()
    return loggedInUser
  }, [fetchPermissions])

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken()
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // best-effort — clear the local session regardless
    }
    clearSession()
  }, [clearSession])

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, permissions, isSuperAdmin, refetchPermissions: fetchPermissions }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
