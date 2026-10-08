import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import SchoolsListPage from '../features/schools/SchoolsListPage.jsx'
import CreateSchoolPage from '../features/schools/CreateSchoolPage.jsx'
import SchoolDetailPage from '../features/schools/SchoolDetailPage.jsx'
import AdminsListPage from '../features/admins/AdminsListPage.jsx'

export default function SuperAdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/schools" element={<SchoolsListPage />} />
      <Route path="/schools/new" element={<CreateSchoolPage />} />
      <Route path="/schools/:schoolId" element={<SchoolDetailPage />} />
      <Route path="/admins" element={<AdminsListPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
