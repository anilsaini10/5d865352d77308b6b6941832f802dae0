import { Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboardPage from '../features/admin/dashboard/AdminDashboardPage.jsx'
import ClassesPage from '../features/admin/classes/ClassesPage.jsx'
import SubjectsPage from '../features/admin/subjects/SubjectsPage.jsx'
import StudentsPage from '../features/admin/students/StudentsPage.jsx'
import TeachersPage from '../features/admin/teachers/TeachersPage.jsx'
import TeacherDetailPage from '../features/admin/teachers/TeacherDetailPage.jsx'
import StaffPage from '../features/admin/staff/StaffPage.jsx'
import TimetablePage from '../features/admin/schedule/TimetablePage.jsx'
import ExamsPage from '../features/admin/exams/ExamsPage.jsx'
import ExamDetailPage from '../features/admin/exams/ExamDetailPage.jsx'
import AttendanceReportPage from '../features/admin/attendance/AttendanceReportPage.jsx'
import ClassAttendancePage from '../features/admin/attendance/ClassAttendancePage.jsx'
import TeacherAttendancePage from '../features/admin/teacherAttendance/TeacherAttendancePage.jsx'
import LeavePage from '../features/admin/leave/LeavePage.jsx'
import AnnouncementsPage from '../features/admin/announcements/AnnouncementsPage.jsx'
import EventsPage from '../features/admin/events/EventsPage.jsx'
import SchoolSettingsPage from '../features/admin/school/SchoolSettingsPage.jsx'
import HelpPage from '../features/admin/help/HelpPage.jsx'
import AcademicCalendarPage from '../features/admin/calendar/AcademicCalendarPage.jsx'
import TeacherAvailabilityPage from '../features/admin/availability/TeacherAvailabilityPage.jsx'
import NotificationsPage from '../features/admin/notifications/NotificationsPage.jsx'
import RecoveryRequestsPage from '../features/admin/recovery/RecoveryRequestsPage.jsx'
import ProfilePage from '../features/auth/ProfilePage.jsx'
import PlansPage from '../features/admin/billing/PlansPage.jsx'
import SubscriptionsPage from '../features/admin/billing/SubscriptionsPage.jsx'
import { EntitlementsProvider } from '../features/admin/billing/EntitlementsContext.jsx'
import PaywallGate from '../features/admin/billing/components/PaywallGate.jsx'
import LockedModal from '../features/admin/billing/components/LockedModal.jsx'

export default function AdminRoutes() {
  return (
    <EntitlementsProvider>
      <Routes>
        <Route path="/" element={<AdminDashboardPage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/teachers/:teacherId" element={<TeacherDetailPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/exams/:examId" element={<ExamDetailPage />} />
        <Route path="/attendance" element={<AttendanceReportPage />} />
        <Route path="/attendance/:classId" element={<ClassAttendancePage />} />
        <Route path="/teacher-attendance" element={<TeacherAttendancePage />} />
        <Route path="/leave" element={<LeavePage />} />
        <Route path="/recovery-requests" element={<RecoveryRequestsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/school" element={<SchoolSettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/academic-calendar" element={<AcademicCalendarPage />} />
        <Route path="/teacher-availability" element={<TeacherAvailabilityPage />} />
        <Route path="/billing/plans" element={<PlansPage />} />
        <Route path="/billing/subscriptions" element={<SubscriptionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PaywallGate />
      <LockedModal />
    </EntitlementsProvider>
  )
}
