import { Navigate, Route, Routes } from 'react-router-dom'
import ProfilePage from '../features/auth/ProfilePage.jsx'
import StaffHomePage from '../features/staff/StaffHomePage.jsx'
import ClassesPage from '../features/admin/classes/ClassesPage.jsx'
import SubjectsPage from '../features/admin/subjects/SubjectsPage.jsx'
import StudentsPage from '../features/admin/students/StudentsPage.jsx'
import TeachersPage from '../features/admin/teachers/TeachersPage.jsx'
import TimetablePage from '../features/admin/schedule/TimetablePage.jsx'
import ExamsPage from '../features/admin/exams/ExamsPage.jsx'
import AcademicCalendarPage from '../features/admin/calendar/AcademicCalendarPage.jsx'
import AttendanceReportPage from '../features/admin/attendance/AttendanceReportPage.jsx'
import ClassAttendancePage from '../features/admin/attendance/ClassAttendancePage.jsx'
import AnnouncementsPage from '../features/admin/announcements/AnnouncementsPage.jsx'
import EventsPage from '../features/admin/events/EventsPage.jsx'
import NotificationsPage from '../features/admin/notifications/NotificationsPage.jsx'
import LeavePage from '../features/admin/leave/LeavePage.jsx'
import SalaryPage from '../features/admin/salary/SalaryPage.jsx'
import FeesPage from '../features/admin/fees/FeesPage.jsx'
import PermissionRoute from '../components/PermissionRoute.jsx'
import { P } from '../constants/permissions.js'

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
      <Route path="/classes" element={<PermissionRoute perm={P.CLASSES_VIEW}><ClassesPage /></PermissionRoute>} />
      <Route path="/subjects" element={<PermissionRoute perm={P.SUBJECTS_VIEW}><SubjectsPage /></PermissionRoute>} />
      <Route path="/students" element={<PermissionRoute perm={P.STUDENTS_VIEW}><StudentsPage /></PermissionRoute>} />
      <Route path="/teachers" element={<PermissionRoute perm={P.TEACHERS_VIEW}><TeachersPage /></PermissionRoute>} />
      <Route path="/timetable" element={<PermissionRoute perm={P.TIMETABLE_VIEW}><TimetablePage /></PermissionRoute>} />
      <Route path="/exams" element={<PermissionRoute perm={P.EXAMS_VIEW}><ExamsPage /></PermissionRoute>} />
      <Route path="/academic-calendar" element={<PermissionRoute perm={P.CALENDAR_VIEW}><AcademicCalendarPage /></PermissionRoute>} />
      <Route path="/attendance" element={<PermissionRoute perm={P.ATTENDANCE_VIEW}><AttendanceReportPage /></PermissionRoute>} />
      <Route path="/attendance/:classId" element={<PermissionRoute perm={P.ATTENDANCE_VIEW}><ClassAttendancePage /></PermissionRoute>} />
      <Route path="/announcements" element={<PermissionRoute perm={P.ANNOUNCEMENTS_VIEW}><AnnouncementsPage /></PermissionRoute>} />
      <Route path="/events" element={<PermissionRoute perm={P.EVENTS_VIEW}><EventsPage /></PermissionRoute>} />
      <Route path="/notifications" element={<PermissionRoute perm={P.NOTIFICATIONS_VIEW}><NotificationsPage /></PermissionRoute>} />
      <Route path="/leave" element={<PermissionRoute perm={P.LEAVE_VIEW}><LeavePage /></PermissionRoute>} />
      <Route path="/fees" element={<PermissionRoute perm={P.FEES_VIEW}><FeesPage /></PermissionRoute>} />
      <Route path="/salary" element={<PermissionRoute perm={P.SALARY_VIEW}><SalaryPage /></PermissionRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
