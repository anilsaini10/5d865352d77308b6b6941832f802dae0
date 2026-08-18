import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import LoginPage from './features/auth/LoginPage.jsx'
import ForgotPasswordPage from './features/auth/ForgotPasswordPage.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import SchoolsListPage from './features/schools/SchoolsListPage.jsx'
import CreateSchoolPage from './features/schools/CreateSchoolPage.jsx'
import SchoolDetailPage from './features/schools/SchoolDetailPage.jsx'
import AdminsListPage from './features/admins/AdminsListPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schools"
        element={
          <ProtectedRoute>
            <SchoolsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schools/new"
        element={
          <ProtectedRoute>
            <CreateSchoolPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schools/:schoolId"
        element={
          <ProtectedRoute>
            <SchoolDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admins"
        element={
          <ProtectedRoute>
            <AdminsListPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
