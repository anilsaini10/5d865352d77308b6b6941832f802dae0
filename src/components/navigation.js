import {
  LayoutDashboard, School, Users, Layers, BookOpen, GraduationCap, UserSquare2, BriefcaseBusiness,
  CalendarClock, ClipboardList, CalendarOff, Megaphone, CalendarDays, Bell, Settings, LifeBuoy, Inbox, CalendarRange, Puzzle, KeyRound, CreditCard, Receipt, Sparkles,
  BarChart3, ShieldCheck, UserPlus, LogOut, Home, ShieldHalf, UserRound,
  FileText, ListChecks, ClipboardCheck, Bug, Wallet, IndianRupee, ArrowUpCircle, ClipboardPen, History,
} from 'lucide-react'
import { ROLES } from '../features/auth/roles.js'
import { P } from '../constants/permissions.js'

// Sidebar entries per role, grouped. A group with no title renders without a heading.
// An item may set `feature: '<entitlement key>'` to show a lock icon while that feature is locked
// (pair it with <AppShell feature="<key>"> on the page itself).
// An item may set `permission: '<key>'` to hide it when the user lacks that permission.
// A group with a `title` and `icon` renders as a collapsible section in the sidebar.
export const NAV_BY_ROLE = {
  [ROLES.SUPER_ADMIN]: [
    {
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/schools', label: 'Schools', icon: School },
        { to: '/admins', label: 'Admins', icon: Users },
        { to: '/support', label: 'Support Inbox', icon: Inbox, badge: 'supportOpen' },
        { to: '/crash-reports', label: 'Crash Reports', icon: Bug },
        { to: '/roles', label: 'Roles', icon: ShieldCheck },
        { to: '/role-permissions', label: 'Role Permissions', icon: ShieldHalf },
      ],
    },
    {
      title: 'Subscriptions',
      icon: CreditCard,
      items: [
        { to: '/features', label: 'Features', icon: Puzzle },
        { to: '/plans', label: 'Plans', icon: CreditCard },
        { to: '/subscriptions', label: 'Subscriptions', icon: Receipt },
      ],
    },
    {
      title: 'Settings',
      icon: Settings,
      items: [
        { to: '/profile', label: 'Profile', icon: UserRound },
        { to: '/help', label: 'Help & Support', icon: LifeBuoy },
      ],
    },
  ],
  [ROLES.ADMIN]: [
    {
      items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
    },
    {
      title: 'Academics',
      icon: BookOpen,
      items: [
        { to: '/classes', label: 'Classes', icon: Layers, permission: P.CLASSES_VIEW },
        { to: '/subjects', label: 'Subjects', icon: BookOpen, permission: P.SUBJECTS_VIEW },
        { to: '/timetable', label: 'Timetable', icon: CalendarClock, permission: P.TIMETABLE_VIEW },
        { to: '/exams', label: 'Exams', icon: ClipboardList, permission: P.EXAMS_VIEW },
        { to: '/academic-calendar', label: 'Academic Calendar', icon: CalendarRange, permission: P.CALENDAR_VIEW },
      ],
    },
    {
      title: 'People',
      icon: Users,
      items: [
        { to: '/students', label: 'Students', icon: GraduationCap, alsoActive: ['/attendance'], permission: P.STUDENTS_VIEW },
        { to: '/teachers', label: 'Teachers', icon: UserSquare2, alsoActive: ['/teacher-attendance', '/teacher-availability'], permission: P.TEACHERS_VIEW },
        { to: '/staff', label: 'Staff', icon: BriefcaseBusiness, permission: P.STAFF_VIEW },
        { to: '/admissions', label: 'Admissions', icon: ClipboardPen, alsoActive: ['/admissions'] },
        { to: '/role-accounts', label: 'Role Accounts', icon: UserPlus, permission: P.ROLE_ACCOUNTS_VIEW },
        { to: '/role-permissions', label: 'Role Permissions', icon: ShieldHalf, permission: P.ROLE_PERMISSIONS },
      ],
    },
    {
      title: 'Promotions',
      icon: ArrowUpCircle,
      items: [
        { to: '/academic-sessions', label: 'Academic Sessions', icon: CalendarRange },
        { to: '/promotions', label: 'Promote Students', icon: ArrowUpCircle },
        { to: '/promotions/history', label: 'Promotion History', icon: History },
      ],
    },
    {
      title: 'Syllabus',
      icon: FileText,
      items: [
        { to: '/syllabus', label: 'Dashboard', icon: BarChart3, end: true, permission: P.SYLLABUS_DASHBOARD_VIEW },
        { to: '/syllabus/chapters', label: 'Chapters', icon: BookOpen, permission: P.SYLLABUS_CHAPTER_VIEW },
        { to: '/syllabus/plans', label: 'Plans', icon: FileText, alsoActive: ['/syllabus/plans'], permission: P.SYLLABUS_PLAN_VIEW },
        { to: '/syllabus/reports/class', label: 'Class Progress', icon: ListChecks, permission: P.SYLLABUS_CLASS_PROGRESS_VIEW },
        { to: '/syllabus/reports/teacher', label: 'Teacher Progress', icon: UserSquare2, permission: P.SYLLABUS_TEACHER_PROGRESS_VIEW },
        { to: '/syllabus/reports/delayed', label: 'Delayed Chapters', icon: CalendarOff, permission: P.SYLLABUS_DELAYED_VIEW },
        { to: '/syllabus/approvals', label: 'Approvals', icon: ClipboardCheck, permission: P.SYLLABUS_APPROVAL_VIEW },
      ],
    },
    {
      title: 'Analytics',
      icon: BarChart3,
      items: [
        { to: '/analytics', label: 'Analytics', icon: BarChart3, alsoActive: ['/analytics'], permission: P.REPORTS_VIEW },
      ],
    },
    {
      title: 'Requests',
      icon: Inbox,
      items: [
        { to: '/leave', label: 'Leave requests', icon: CalendarOff, permission: P.LEAVE_VIEW },
        { to: '/recovery-requests', label: 'Recovery Requests', icon: KeyRound, badge: 'recoveryPending', permission: P.RECOVERY_VIEW },
      ],
    },
    {
      title: 'Communication',
      icon: Megaphone,
      items: [
        { to: '/announcements', label: 'Announcements', icon: Megaphone, permission: P.ANNOUNCEMENTS_VIEW },
        { to: '/events', label: 'Events', icon: CalendarDays, permission: P.EVENTS_VIEW },
        { to: '/notifications', label: 'Notifications', icon: Bell, permission: P.NOTIFICATIONS_VIEW },
      ],
    },
    {
      title: 'Finance',
      icon: Wallet,
      items: [
        { to: '/salary', label: 'Salary', icon: Wallet, permission: P.SALARY_VIEW },
        { to: '/fees', label: 'Fees', icon: IndianRupee, permission: P.FEES_VIEW },
      ],
    },
    {
      title: 'Billing',
      icon: CreditCard,
      items: [
        { to: '/billing/plans', label: 'Plans & pricing', icon: Sparkles },
        { to: '/billing/subscriptions', label: 'My subscriptions', icon: Receipt },
      ],
    },
    {
      title: 'Settings',
      icon: Settings,
      items: [
        { to: '/profile', label: 'Profile', icon: UserRound },
        { to: '/school', label: 'School settings', icon: Settings, permission: P.SCHOOL_SETTINGS },
        { to: '/help', label: 'Help & Support', icon: LifeBuoy },
      ],
    },
  ],
  [ROLES.STAFF]: [
    {
      items: [
        { to: '/', label: 'Home', icon: Home, end: true },
      ],
    },
    {
      title: 'Academics',
      icon: BookOpen,
      items: [
        { to: '/classes', label: 'Classes', icon: Layers, permission: P.CLASSES_VIEW },
        { to: '/subjects', label: 'Subjects', icon: BookOpen, permission: P.SUBJECTS_VIEW },
        { to: '/timetable', label: 'Timetable', icon: CalendarClock, permission: P.TIMETABLE_VIEW },
        { to: '/exams', label: 'Exams', icon: ClipboardList, permission: P.EXAMS_VIEW },
        { to: '/academic-calendar', label: 'Academic Calendar', icon: CalendarRange, permission: P.CALENDAR_VIEW },
      ],
    },
    {
      title: 'People',
      icon: Users,
      items: [
        { to: '/students', label: 'Students', icon: GraduationCap, alsoActive: ['/attendance'], permission: P.STUDENTS_VIEW },
        { to: '/teachers', label: 'Teachers', icon: UserSquare2, permission: P.TEACHERS_VIEW },
      ],
    },
    {
      title: 'Communication',
      icon: Megaphone,
      items: [
        { to: '/announcements', label: 'Announcements', icon: Megaphone, permission: P.ANNOUNCEMENTS_VIEW },
        { to: '/events', label: 'Events', icon: CalendarDays, permission: P.EVENTS_VIEW },
        { to: '/notifications', label: 'Notifications', icon: Bell, permission: P.NOTIFICATIONS_VIEW },
      ],
    },
    {
      title: 'Requests',
      icon: Inbox,
      items: [
        { to: '/leave', label: 'Leave requests', icon: CalendarOff, permission: P.LEAVE_VIEW },
      ],
    },
    {
      title: 'Finance',
      icon: Wallet,
      items: [
        { to: '/salary', label: 'Salary', icon: Wallet, permission: P.SALARY_VIEW },
        { to: '/fees', label: 'Fees', icon: IndianRupee, permission: P.FEES_VIEW },
      ],
    },
    {
      title: 'Settings',
      icon: Settings,
      items: [
        { to: '/profile', label: 'Profile', icon: UserRound },
      ],
    },
  ],
}
