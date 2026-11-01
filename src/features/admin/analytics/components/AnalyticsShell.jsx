import { NavLink, useLocation } from 'react-router-dom'
import AppShell from '../../../../components/AppShell.jsx'
import { sessionLabel, updatedAt } from '../analytics.helpers.js'

const TABS = [
  { to: '/analytics', label: 'Dashboard', end: true },
  { to: '/analytics/students', label: 'Students' },
  { to: '/analytics/attendance', label: 'Attendance' },
  { to: '/analytics/academics', label: 'Academics' },
  { to: '/analytics/teachers', label: 'Teachers' },
  { to: '/analytics/homework', label: 'Homework' },
  { to: '/analytics/comparisons', label: 'Comparisons' },
  { to: '/analytics/alerts', label: 'Alerts' },
  { to: '/analytics/interventions', label: 'Interventions' },
]

export default function AnalyticsShell({ title, meta, children }) {
  const location = useLocation()

  return (
    <AppShell title={title} subtitle={meta ? `${sessionLabel(meta)} · ${updatedAt(meta)}` : undefined}>
      <nav className="flex gap-1 overflow-x-auto pb-1 mb-6 -mt-1 border-b border-line">
        {TABS.map((t) => {
          const active = t.end ? location.pathname === t.to : location.pathname.startsWith(t.to)
          return (
            <NavLink
              key={t.to}
              to={t.to + location.search}
              end={t.end}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                active ? 'bg-board text-on-board' : 'text-ink/55 hover:text-ink hover:bg-line/40'
              }`}
            >
              {t.label}
            </NavLink>
          )
        })}
      </nav>
      {children}
    </AppShell>
  )
}
