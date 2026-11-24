import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return null
  if (!user) return <Navigate to="/welcome" state={{ from: location.pathname }} replace />
  return children
}
