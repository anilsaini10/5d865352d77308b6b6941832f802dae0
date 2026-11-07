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
import AnalyticsDashboardPage from '../features/admin/analytics/AnalyticsDashboardPage.jsx'
import StudentsAnalyticsPage from '../features/admin/analytics/StudentsAnalyticsPage.jsx'
import AttendanceAnalyticsPage from '../features/admin/analytics/AttendanceAnalyticsPage.jsx'
import AcademicsAnalyticsPage from '../features/admin/analytics/AcademicsAnalyticsPage.jsx'
import TeachersAnalyticsPage from '../features/admin/analytics/TeachersAnalyticsPage.jsx'
import HomeworkAnalyticsPage from '../features/admin/analytics/HomeworkAnalyticsPage.jsx'
import ComparisonsAnalyticsPage from '../features/admin/analytics/ComparisonsAnalyticsPage.jsx'
import AlertsAnalyticsPage from '../features/admin/analytics/AlertsAnalyticsPage.jsx'
import InterventionsAnalyticsPage from '../features/admin/analytics/InterventionsAnalyticsPage.jsx'
import PlansPage from '../features/admin/billing/PlansPage.jsx'
import SubscriptionsPage from '../features/admin/billing/SubscriptionsPage.jsx'
import RoleAccountsPage from '../features/admin/roleAccounts/RoleAccountsPage.jsx'
import RolePermissionsPage from '../features/admin/permissions/RolePermissionsPage.jsx'
import SyllabusDashboardPage from '../features/admin/syllabus/SyllabusDashboardPage.jsx'
import ChaptersPage from '../features/admin/syllabus/ChaptersPage.jsx'
import PlansListPage from '../features/admin/syllabus/PlansListPage.jsx'
import CreatePlanPage from '../features/admin/syllabus/CreatePlanPage.jsx'
import PlanDetailPage from '../features/admin/syllabus/PlanDetailPage.jsx'
import ClassProgressPage from '../features/admin/syllabus/ClassProgressPage.jsx'
import TeacherProgressPage from '../features/admin/syllabus/TeacherProgressPage.jsx'
import DelayedChaptersPage from '../features/admin/syllabus/DelayedChaptersPage.jsx'
import ApprovalsPage from '../features/admin/syllabus/ApprovalsPage.jsx'
import PermissionRoute from '../components/PermissionRoute.jsx'
import { P } from '../constants/permissions.js'
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
        <Route path="/role-accounts" element={<RoleAccountsPage />} />
        <Route path="/role-permissions" element={<RolePermissionsPage />} />
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
        <Route path="/analytics" element={<PermissionRoute perm={P.REPORTS_VIEW}><AnalyticsDashboardPage /></PermissionRoute>} />
        <Route path="/analytics/students" element={<PermissionRoute perm={P.REPORTS_VIEW}><StudentsAnalyticsPage /></PermissionRoute>} />
        <Route path="/analytics/attendance" element={<PermissionRoute perm={P.REPORTS_VIEW}><AttendanceAnalyticsPage /></PermissionRoute>} />
        <Route path="/analytics/academics" element={<PermissionRoute perm={P.REPORTS_VIEW}><AcademicsAnalyticsPage /></PermissionRoute>} />
        <Route path="/analytics/teachers" element={<PermissionRoute perm={P.REPORTS_VIEW}><TeachersAnalyticsPage /></PermissionRoute>} />
        <Route path="/analytics/homework" element={<PermissionRoute perm={P.REPORTS_VIEW}><HomeworkAnalyticsPage /></PermissionRoute>} />
        <Route path="/analytics/comparisons" element={<PermissionRoute perm={P.REPORTS_VIEW}><ComparisonsAnalyticsPage /></PermissionRoute>} />
        <Route path="/analytics/alerts" element={<PermissionRoute perm={P.REPORTS_VIEW}><AlertsAnalyticsPage /></PermissionRoute>} />
        <Route path="/analytics/interventions" element={<PermissionRoute perm={P.REPORTS_VIEW}><InterventionsAnalyticsPage /></PermissionRoute>} />
        <Route path="/syllabus" element={<PermissionRoute perm={P.SYLLABUS_DASHBOARD_VIEW}><SyllabusDashboardPage /></PermissionRoute>} />
        <Route path="/syllabus/chapters" element={<PermissionRoute perm={P.SYLLABUS_CHAPTER_VIEW}><ChaptersPage /></PermissionRoute>} />
        <Route path="/syllabus/plans" element={<PermissionRoute perm={P.SYLLABUS_PLAN_VIEW}><PlansListPage /></PermissionRoute>} />
        <Route path="/syllabus/plans/create" element={<PermissionRoute perm={P.SYLLABUS_PLAN_MANAGE}><CreatePlanPage /></PermissionRoute>} />
        <Route path="/syllabus/plans/:planId" element={<PermissionRoute perm={P.SYLLABUS_PLAN_VIEW}><PlanDetailPage /></PermissionRoute>} />
        <Route path="/syllabus/reports/class" element={<PermissionRoute perm={P.SYLLABUS_CLASS_PROGRESS_VIEW}><ClassProgressPage /></PermissionRoute>} />
        <Route path="/syllabus/reports/teacher" element={<PermissionRoute perm={P.SYLLABUS_TEACHER_PROGRESS_VIEW}><TeacherProgressPage /></PermissionRoute>} />
        <Route path="/syllabus/reports/delayed" element={<PermissionRoute perm={P.SYLLABUS_DELAYED_VIEW}><DelayedChaptersPage /></PermissionRoute>} />
        <Route path="/syllabus/approvals" element={<PermissionRoute perm={P.SYLLABUS_APPROVAL_VIEW}><ApprovalsPage /></PermissionRoute>} />
        <Route path="/billing/plans" element={<PlansPage />} />
        <Route path="/billing/subscriptions" element={<SubscriptionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PaywallGate />
      <LockedModal />
    </EntitlementsProvider>
  )
}
