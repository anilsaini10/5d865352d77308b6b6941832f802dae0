import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { authApi } from './auth.api.js'
import { tokenStorage } from '../../api/tokenStorage.js'
import { registerSessionExpiredHandler } from '../../api/httpClient.js'

const AuthContext = createContext(null)

const REFETCH_THROTTLE_MS = 5 * 60_000

function loadCachedPermissions(userId) {
  const cached = tokenStorage.getPermissionCache()
  if (!cached || cached.userId !== userId) return null
  return cached
}

function savePermissionCache(userId, data) {
  tokenStorage.setPermissionCache({
    permissions: data.permissions ?? {},
    isSuperAdmin: !!data.isSuperAdmin,
    role: data.role ?? null,
    customRole: data.customRole ?? null,
    fetchedAt: Date.now(),
    userId,
  })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [permissions, setPermissions] = useState({})
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [permissionsLoading, setPermissionsLoading] = useState(true)
  const lastFetchRef = useRef(0)

  const applyPermissions = useCallback((data) => {
    setPermissions(data.permissions ?? {})
    setIsSuperAdmin(!!data.isSuperAdmin)
    lastFetchRef.current = Date.now()
  }, [])

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    setPermissions({})
    setIsSuperAdmin(false)
    setPermissionsLoading(false)
  }, [])

  const fetchPermissions = useCallback(async (userId) => {
    try {
      setPermissionsLoading(true)
      const data = await authApi.getPermissions()
      applyPermissions(data)
      if (userId) savePermissionCache(userId, data)
    } catch {
      // non-critical — keep whatever we had
    } finally {
      setPermissionsLoading(false)
    }
  }, [applyPermissions])

  useEffect(() => {
    const storedUser = tokenStorage.getUser()
    const accessToken = tokenStorage.getAccessToken()
    if (storedUser && accessToken) {
      setUser(storedUser)

      const cached = loadCachedPermissions(storedUser.id)
      if (cached) {
        applyPermissions(cached)
        setPermissionsLoading(false)
      }

      fetchPermissions(storedUser.id)
    } else {
      setPermissionsLoading(false)
    }
    setReady(true)

    registerSessionExpiredHandler(clearSession)
  }, [clearSession, fetchPermissions, applyPermissions])

  useEffect(() => {
    if (!user) return undefined
    const onFocus = () => {
      const cached = loadCachedPermissions(user.id)
      const age = cached?.fetchedAt ? Date.now() - cached.fetchedAt : Infinity
      if (age > REFETCH_THROTTLE_MS) {
        fetchPermissions(user.id)
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user, fetchPermissions])

  const login = useCallback(async (identifier, password, role, schoolId, customRoleId) => {
    const { user: loggedInUser, tokens } = await authApi.login(identifier, password, role, schoolId, customRoleId)
    tokenStorage.setTokens(tokens)
    tokenStorage.setUser(loggedInUser)
    setUser(loggedInUser)
    fetchPermissions(loggedInUser.id)
    return loggedInUser
  }, [fetchPermissions])

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken()
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // best-effort
    }
    clearSession()
  }, [clearSession])

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, permissions, isSuperAdmin, permissionsLoading, refetchPermissions: () => fetchPermissions(user?.id) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
