import { NavLink, useLocation } from 'react-router-dom'

// Pairs shown as two buttons at the top of their pages. The sidebar has one entry per section.
const SECTIONS = [
  [
    { to: '/students', label: 'Students' },
    { to: '/attendance', label: 'Student attendance' },
  ],
  [
    { to: '/teachers', label: 'Teachers' },
    { to: '/teacher-attendance', label: 'Teacher attendance' },
    { to: '/teacher-availability', label: 'Availability' },
  ],
]

/** Two-button switcher (e.g. Students | Student attendance). Renders only on the section's top-level pages. */
export default function SectionSwitch() {
  const { pathname } = useLocation()
  const path = pathname.replace(/\/+$/, '') || '/'
  const pair = SECTIONS.find((items) => items.some((i) => i.to === path))
  if (!pair) return null

  return (
    <nav aria-label="Section" className="mb-5 inline-flex gap-1 p-1 bg-surface border border-line rounded-xl max-w-full overflow-x-auto">
      {pair.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              isActive ? 'bg-board text-on-board' : 'text-ink/60 hover:text-ink hover:bg-line/40'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
