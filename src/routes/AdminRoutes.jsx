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
import ExamMarksPage from '../features/admin/exams/ExamMarksPage.jsx'
import AttendanceReportPage from '../features/admin/attendance/AttendanceReportPage.jsx'
import ClassAttendancePage from '../features/admin/attendance/ClassAttendancePage.jsx'
import TeacherAttendancePage from '../features/admin/teacherAttendance/TeacherAttendancePage.jsx'
import LeavePage from '../features/admin/leave/LeavePage.jsx'
import AnnouncementsPage from '../features/admin/announcements/AnnouncementsPage.jsx'
import EventsPage from '../features/admin/events/EventsPage.jsx'
import NotificationsPage from '../features/admin/notifications/NotificationsPage.jsx'

export default function AdminRoutes() {
  return (
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
      <Route path="/exams/:examId/classes/:classId" element={<ExamMarksPage />} />
      <Route path="/attendance" element={<AttendanceReportPage />} />
      <Route path="/attendance/:classId" element={<ClassAttendancePage />} />
      <Route path="/teacher-attendance" element={<TeacherAttendancePage />} />
      <Route path="/leave" element={<LeavePage />} />
      <Route path="/announcements" element={<AnnouncementsPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
