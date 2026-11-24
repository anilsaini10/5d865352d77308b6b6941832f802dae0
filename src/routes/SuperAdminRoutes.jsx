import { Navigate, Route, Routes } from 'react-router-dom'
import ProfilePage from '../features/auth/ProfilePage.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import SchoolsListPage from '../features/schools/SchoolsListPage.jsx'
import CreateSchoolPage from '../features/schools/CreateSchoolPage.jsx'
import SchoolDetailPage from '../features/schools/SchoolDetailPage.jsx'
import SupportInboxPage from '../features/support/SupportInboxPage.jsx'
import AdminsListPage from '../features/admins/AdminsListPage.jsx'
import FeaturesPage from '../features/subscription/features/FeaturesPage.jsx'
import PlansPage from '../features/subscription/plans/PlansPage.jsx'
import PlanDetailPage from '../features/subscription/plans/PlanDetailPage.jsx'
import SubscriptionsPage from '../features/subscription/subscriptions/SubscriptionsPage.jsx'
import RolesPage from '../features/roles/RolesPage.jsx'
import SuperAdminRolePermissionsPage from '../features/schools/SuperAdminRolePermissionsPage.jsx'
import CrashReportsPage from '../features/crashReports/CrashReportsPage.jsx'

export default function SuperAdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/schools" element={<SchoolsListPage />} />
      <Route path="/schools/new" element={<CreateSchoolPage />} />
      <Route path="/schools/:schoolId" element={<SchoolDetailPage />} />
      <Route path="/admins" element={<AdminsListPage />} />
      <Route path="/roles" element={<RolesPage />} />
      <Route path="/role-permissions" element={<SuperAdminRolePermissionsPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route path="/plans/:planId" element={<PlanDetailPage />} />
      <Route path="/subscriptions" element={<SubscriptionsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/support" element={<SupportInboxPage />} />
      <Route path="/crash-reports" element={<CrashReportsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
