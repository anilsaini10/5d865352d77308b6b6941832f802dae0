import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogOut, KeyRound, GraduationCap, X } from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext.jsx'
import ChangePasswordModal from '../features/auth/components/ChangePasswordModal.jsx'
import { ROLE_LABELS, ROLES } from '../features/auth/roles.js'
import { NAV_BY_ROLE } from './navigation.js'
import { useSupportOpenCount } from '../features/support/useSupportOpenCount.js'

export default function Sidebar({ open, onClose }) {
  const { logout, user } = useAuth()
  const { pathname } = useLocation()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const role = user?.role ?? ROLES.SUPER_ADMIN
  const navGroups = NAV_BY_ROLE[role] ?? []
  const roleLabel = ROLE_LABELS[role]
  const isAdmin = role === ROLES.ADMIN
  const badges = { supportOpen: useSupportOpenCount(role === ROLES.SUPER_ADMIN) }
  // Admin: first word of the school name on top, the rest below ("Admin Panel" if it's a single word).
  const [firstWord = '', ...restWords] = (isAdmin ? user?.schoolName?.trim() ?? '' : '').split(/\s+/)
  const brandTitle = firstWord || 'Nougth One'
  const brandSubtitle = isAdmin ? restWords.join(' ') || 'Admin Panel' : roleLabel

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
        className={`fixed lg:sticky top-0 h-screen w-72 bg-board text-on-board flex flex-col z-40 transition-transform duration-300 shrink-0
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-chalk/90 flex items-center justify-center shrink-0">
              <GraduationCap size={20} className="text-board" strokeWidth={2.4} />
            </div>
            <div>
              <p className="font-display font-semibold text-lg leading-tight truncate max-w-[10rem]" title={isAdmin ? user?.schoolName : undefined}>{brandTitle}</p>
              <p className="text-[11px] uppercase tracking-wider text-on-board/50 font-medium truncate max-w-[10rem]">
                {brandSubtitle}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-on-board/60 hover:text-on-board p-1" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-4 mt-2 pb-3 space-y-4">
          {navGroups.map((group, i) => (
            <div key={group.title ?? i} className="space-y-1">
              {group.title && (
                <p className="px-3.5 pb-1 text-[11px] uppercase tracking-wider text-on-board/40 font-semibold">{group.title}</p>
              )}
              {group.items.map(({ to, label, icon: Icon, end, badge, alsoActive }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive || alsoActive?.some((p) => pathname === p || pathname.startsWith(`${p}/`))
                        ? 'bg-on-board/10 text-on-board'
                        : 'text-on-board/65 hover:text-on-board hover:bg-on-board/5'
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={2.1} />
                  {label}
                  {badge && badges[badge] > 0 && (
                    <span className="ml-auto min-w-[1.375rem] text-center rounded-full bg-chalk text-board text-[11px] font-bold px-1.5 py-0.5" aria-label={`${badges[badge]} open`}>
                      {badges[badge] > 99 ? '99+' : badges[badge]}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="mx-4 mb-4 mt-2 p-3 rounded-2xl bg-board-dark border border-on-board/10 shadow-card">
          <div className="flex items-center gap-3 px-1 pb-3 mb-2 border-b border-on-board/10">
            <div className="w-9 h-9 rounded-full bg-chalk text-board font-display font-semibold flex items-center justify-center text-sm shrink-0">
              {user?.name?.[0] ?? 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-on-board/60 truncate">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={() => setChangePasswordOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-on-board/75 hover:text-on-board hover:bg-on-board/10 transition-colors"
          >
            <KeyRound size={17} />
            Change password
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-on-board/75 hover:text-on-board hover:bg-coral/80 transition-colors"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </aside>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </>
  )
}
