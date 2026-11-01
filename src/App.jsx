import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import LoginPage from './features/auth/LoginPage.jsx'
import ForgotPasswordPage from './features/auth/ForgotPasswordPage.jsx'
import { useAuth } from './features/auth/AuthContext.jsx'
import { ROLES } from './features/auth/roles.js'
import { PageLoader } from './components/ui.jsx'

const SuperAdminRoutes = lazy(() => import('./routes/SuperAdminRoutes.jsx'))
const AdminRoutes = lazy(() => import('./routes/AdminRoutes.jsx'))
const StaffRoutes = lazy(() => import('./routes/StaffRoutes.jsx'))

function RoleRoutes() {
  const { user } = useAuth()
  return (
    <Suspense fallback={<PageLoader className="min-h-screen" />}>
      {user?.role === ROLES.ADMIN ? (
        <AdminRoutes />
      ) : user?.role === ROLES.STAFF ? (
        <StaffRoutes customRoleKey={user?.customRole?.key} />
      ) : (
        <SuperAdminRoutes />
      )}
    </Suspense>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <RoleRoutes />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
