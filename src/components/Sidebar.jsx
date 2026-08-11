import { NavLink } from 'react-router-dom'
import { LayoutGrid, School, Users, LogOut, GraduationCap, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/schools', label: 'Schools', icon: School },
  { to: '/admins', label: 'Admins', icon: Users },
]

export default function Sidebar({ open, onClose }) {
  const { logout, user } = useAuth()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-ink/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-72 bg-board text-paper flex flex-col z-40 transition-transform duration-300 shrink-0
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-chalk/90 flex items-center justify-center shrink-0">
              <GraduationCap size={20} className="text-board" strokeWidth={2.4} />
            </div>
            <div>
              <p className="font-display font-semibold text-lg leading-tight">Vidyalaya</p>
              <p className="text-[11px] uppercase tracking-wider text-paper/50 font-medium">Super Admin</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-paper/60 hover:text-paper p-1" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'bg-paper/10 text-paper chalk-underline'
                    : 'text-paper/65 hover:text-paper hover:bg-paper/5'
                }`
              }
            >
              <Icon size={18} strokeWidth={2.1} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-5 pt-3 border-t border-paper/10 mx-4">
          <div className="flex items-center gap-3 px-1 py-2">
            <div className="w-9 h-9 rounded-full bg-chalk text-board font-display font-semibold flex items-center justify-center text-sm shrink-0">
              {user?.name?.[0] ?? 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-paper/50 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-sm font-medium text-paper/65 hover:text-paper hover:bg-paper/5 transition-colors"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </aside>
    </>
  )
}
