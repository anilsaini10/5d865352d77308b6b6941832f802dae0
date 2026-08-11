import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const SESSION_KEY = 'vidyalaya_session'

// Demo credentials for this template — replace with real auth later.
const DEMO_USER = {
  name: 'Anil Saini',
  email: 'superadmin@vidyalaya.app',
  role: 'Super Admin',
}
const DEMO_PASSWORD = 'admin123'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(SESSION_KEY)
      }
    }
    setReady(true)
  }, [])

  const login = (email, password) => {
    if (
      email.trim().toLowerCase() === DEMO_USER.email &&
      password === DEMO_PASSWORD
    ) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_USER))
      setUser(DEMO_USER)
      return { ok: true }
    }
    return { ok: false, error: 'Email ya password galat hai.' }
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, ready, demo: DEMO_USER, demoPassword: DEMO_PASSWORD }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
