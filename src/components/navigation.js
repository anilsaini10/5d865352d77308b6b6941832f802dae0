import {
  LayoutDashboard, School, Users, Layers, BookOpen, GraduationCap, UserSquare2, BriefcaseBusiness,
  CalendarClock, ClipboardList, CalendarCheck, UserCheck, CalendarOff, Megaphone, CalendarDays, Bell,
} from 'lucide-react'
import { ROLES } from '../features/auth/roles.js'

// Sidebar entries per role, grouped. A group with no title renders without a heading.
export const NAV_BY_ROLE = {
  [ROLES.SUPER_ADMIN]: [
    {
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/schools', label: 'Schools', icon: School },
        { to: '/admins', label: 'Admins', icon: Users },
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
      ],
    },
    {
      title: 'People',
      items: [
        { to: '/students', label: 'Students', icon: GraduationCap },
        { to: '/teachers', label: 'Teachers', icon: UserSquare2 },
        { to: '/staff', label: 'Staff', icon: BriefcaseBusiness },
      ],
    },
    {
      title: 'Attendance',
      items: [
        { to: '/attendance', label: 'Student attendance', icon: CalendarCheck },
        { to: '/teacher-attendance', label: 'Teacher attendance', icon: UserCheck },
        { to: '/leave', label: 'Leave requests', icon: CalendarOff },
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
  ],
}
