import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from './auth.api.js'
import { tokenStorage } from '../../api/tokenStorage.js'
import { registerSessionExpiredHandler } from '../../api/httpClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    const storedUser = tokenStorage.getUser()
    const accessToken = tokenStorage.getAccessToken()
    if (storedUser && accessToken) setUser(storedUser)
    setReady(true)

    registerSessionExpiredHandler(clearSession)
  }, [clearSession])

  const login = useCallback(async (identifier, password) => {
    const { user: loggedInUser, tokens } = await authApi.login(identifier, password)
    tokenStorage.setTokens(tokens)
    tokenStorage.setUser(loggedInUser)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

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
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
