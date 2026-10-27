import { useLayoutEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { UserRound, GraduationCap, Lock, X } from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext.jsx'
import { ROLE_LABELS, ROLES } from '../features/auth/roles.js'
import { NAV_BY_ROLE } from './navigation.js'
import { useFeature } from '../features/admin/billing/EntitlementsContext.jsx'
import { useSupportOpenCount } from '../features/support/useSupportOpenCount.js'
import { useRecoveryPendingCount } from '../features/admin/recovery/useRecoveryPendingCount.js'

// AppShell (and so Sidebar) remounts on every page change, which would reset the nav scroll to the top.
let savedNavScroll = 0

function isActiveItem(pathname, to, end, alsoActive) {
  const match = (p, exact) => pathname === p || (!exact && pathname.startsWith(`${p}/`))
  return match(to, end) || !!alsoActive?.some((p) => match(p, false))
}

/** Lock icon for a nav item whose paid feature the admin can't use. */
function NavLock({ feature }) {
  const { hasAccess } = useFeature(feature)
  return hasAccess ? null : <Lock size={14} className="ml-auto opacity-60" aria-label="Locked" />
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const role = user?.role ?? ROLES.SUPER_ADMIN
  const navGroups = NAV_BY_ROLE[role] ?? []
  const roleLabel = ROLE_LABELS[role]
  const isAdmin = role === ROLES.ADMIN
  const badges = {
    supportOpen: useSupportOpenCount(role === ROLES.SUPER_ADMIN),
    recoveryPending: useRecoveryPendingCount(role === ROLES.ADMIN),
  }
  // Admin: first word of the school name on top, the rest below ("Admin Panel" if it's a single word).
  const [firstWord = '', ...restWords] = (isAdmin ? user?.schoolName?.trim() ?? '' : '').split(/\s+/)
  const brandTitle = firstWord || 'Nougth One'
  const brandSubtitle = isAdmin ? restWords.join(' ') || 'Admin Panel' : roleLabel

  const navRef = useRef(null)

  // Restore the previous scroll, then make sure the active item is visible.
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    nav.scrollTop = savedNavScroll
    const active = nav.querySelector('[data-active="true"]')
    if (active) {
      const navBox = nav.getBoundingClientRect()
      const box = active.getBoundingClientRect()
      if (box.top < navBox.top) nav.scrollTop -= navBox.top - box.top + 8
      else if (box.bottom > navBox.bottom) nav.scrollTop += box.bottom - navBox.bottom + 8
    }
  }, [pathname])

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

        <nav
          ref={navRef}
          onScroll={(e) => { savedNavScroll = e.currentTarget.scrollTop }}
          className="flex-1 min-h-0 overflow-y-auto px-4 mt-2 pb-3 space-y-4"
        >
          {navGroups.map((group, i) => (
            <div key={group.title ?? i} className="space-y-1">
              {group.title && (
                <p className="px-3.5 pb-1 text-[11px] uppercase tracking-wider text-on-board/40 font-semibold">{group.title}</p>
              )}
              {group.items.map(({ to, label, icon: Icon, end, badge, alsoActive, feature }) => (
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
                  data-active={isActiveItem(pathname, to, end, alsoActive)}
                >
                  <Icon size={18} strokeWidth={2.1} />
                  {label}
                  {feature && <NavLock feature={feature} />}
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
          <NavLink
            to="/profile"
            onClick={onClose}
            data-paywall-allow
            className={({ isActive }) =>
              `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-on-board/10 text-on-board' : 'text-on-board/75 hover:text-on-board hover:bg-on-board/10'
              }`
            }
          >
            <UserRound size={17} />
            Profile
          </NavLink>
        </div>
      </aside>

    </>
  )
}
