import {
  LayoutDashboard, School, Users, Layers, BookOpen, GraduationCap, UserSquare2, BriefcaseBusiness,
  CalendarClock, ClipboardList, CalendarOff, Megaphone, CalendarDays, Bell, Settings, LifeBuoy, Inbox, CalendarRange, Puzzle, KeyRound, CreditCard, Receipt, Sparkles,
} from 'lucide-react'
import { ROLES } from '../features/auth/roles.js'

// Sidebar entries per role, grouped. A group with no title renders without a heading.
// An item may set `feature: '<entitlement key>'` to show a lock icon while that feature is locked
// (pair it with <AppShell feature="<key>"> on the page itself).
export const NAV_BY_ROLE = {
  [ROLES.SUPER_ADMIN]: [
    {
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/schools', label: 'Schools', icon: School },
        { to: '/admins', label: 'Admins', icon: Users },
        { to: '/support', label: 'Support Inbox', icon: Inbox, badge: 'supportOpen' },
      ],
    },
    {
      title: 'Subscriptions',
      items: [
        { to: '/features', label: 'Features', icon: Puzzle },
        { to: '/plans', label: 'Plans', icon: CreditCard },
        { to: '/subscriptions', label: 'Subscriptions', icon: Receipt },
      ],
    },
  ],
  [ROLES.ADMIN]: [
    {
      items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
    },
    {
      title: 'Academics',
      items: [
        { to: '/classes', label: 'Classes', icon: Layers },
        { to: '/subjects', label: 'Subjects', icon: BookOpen },
        { to: '/timetable', label: 'Timetable', icon: CalendarClock },
        { to: '/exams', label: 'Exams', icon: ClipboardList },
        { to: '/academic-calendar', label: 'Academic Calendar', icon: CalendarRange },
      ],
    },
    {
      title: 'People',
      items: [
        { to: '/students', label: 'Students', icon: GraduationCap, alsoActive: ['/attendance'] },
        { to: '/teachers', label: 'Teachers', icon: UserSquare2, alsoActive: ['/teacher-attendance', '/teacher-availability'] },
        { to: '/staff', label: 'Staff', icon: BriefcaseBusiness },
      ],
    },
    {
      title: 'Requests',
      items: [
        { to: '/leave', label: 'Leave requests', icon: CalendarOff },
        { to: '/recovery-requests', label: 'Recovery Requests', icon: KeyRound, badge: 'recoveryPending' },
      ],
    },
    {
      title: 'Communication',
      items: [
        { to: '/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/events', label: 'Events', icon: CalendarDays },
        { to: '/notifications', label: 'Notifications', icon: Bell },
      ],
    },
    {
      title: 'Billing',
      items: [
        { to: '/billing/plans', label: 'Plans & pricing', icon: Sparkles },
        { to: '/billing/subscriptions', label: 'My subscriptions', icon: Receipt },
      ],
    },
    {
      title: 'Settings',
      items: [
        { to: '/school', label: 'School settings', icon: Settings },
        { to: '/help', label: 'Help & Support', icon: LifeBuoy },
      ],
    },
  ],
}
