import { Navigate, Route, Routes } from 'react-router-dom'
import ProfilePage from '../features/auth/ProfilePage.jsx'
import StaffHomePage from '../features/staff/StaffHomePage.jsx'

const STAFF_HOME = {
  // Map customRole.key to a landing route as features are built out.
  // ACCOUNTANT: '/staff/accountant',
}

export default function StaffRoutes({ customRoleKey }) {
  const home = STAFF_HOME[customRoleKey]

  return (
    <Routes>
      <Route path="/" element={home ? <Navigate to={home} replace /> : <StaffHomePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
