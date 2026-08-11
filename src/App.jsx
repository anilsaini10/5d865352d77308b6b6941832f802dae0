import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Schools from './pages/Schools.jsx'
import Admins from './pages/Admins.jsx'

function ProtectedRoute({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return null
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/schools" element={<ProtectedRoute><Schools /></ProtectedRoute>} />
      <Route path="/admins" element={<ProtectedRoute><Admins /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
