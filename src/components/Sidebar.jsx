import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight, GraduationCap, Lock, ShieldOff, X } from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext.jsx'
import { usePermissions } from '../hooks/usePermission.js'
import { ROLE_LABELS, ROLES } from '../features/auth/roles.js'
import { NAV_BY_ROLE } from './navigation.js'
import { useFeature } from '../features/admin/billing/EntitlementsContext.jsx'
import { useSupportOpenCount } from '../features/support/useSupportOpenCount.js'
import { useRecoveryPendingCount } from '../features/admin/recovery/useRecoveryPendingCount.js'
import { useToast } from '../context/ToastContext.jsx'

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
  const { can } = usePermissions()
  const { notify } = useToast()
  const { pathname } = useLocation()
  const role = user?.role ?? ROLES.SUPER_ADMIN
  const roleLabel = ROLE_LABELS[role]
  const isAdmin = role === ROLES.ADMIN
  const isStaff = role === ROLES.STAFF
  const allGroups = NAV_BY_ROLE[role] ?? []
  // Staff: only show items + sections the user actually has permission for
  const navGroups = isStaff
    ? allGroups
        .map((g) => ({ ...g, items: g.items.filter((item) => !item.permission || can(item.permission)) }))
        .filter((g) => g.items.length > 0)
    : allGroups.filter((g) => g.items.length > 0)
  const badges = {
    supportOpen: useSupportOpenCount(role === ROLES.SUPER_ADMIN),
    recoveryPending: useRecoveryPendingCount(role === ROLES.ADMIN),
  }
  // Admin: first word of the school name on top, the rest below ("Admin Panel" if it's a single word).
  const [firstWord = '', ...restWords] = ((isAdmin || isStaff) ? user?.schoolName?.trim() ?? '' : '').split(/\s+/)
  const brandTitle = firstWord || 'Nougth One'
  const brandSubtitle = isAdmin ? restWords.join(' ') || 'Admin Panel' : isStaff ? restWords.join(' ') || (user?.customRole?.name ?? 'Staff') : roleLabel

  // Auto-expand the section containing the current active route
  const activeSection = navGroups.find(g =>
    g.title && g.items.some(item => isActiveItem(pathname, item.to, item.end, item.alsoActive))
  )?.title ?? null

  const [expandedTitle, setExpandedTitle] = useState(activeSection)

  const toggleSection = (title) => {
    setExpandedTitle(prev => prev === title ? null : title)
  }

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

  const renderNavItem = ({ to, label, icon: Icon, end, badge, alsoActive, feature, permission }, indented) => {
    const denied = permission && !can(permission)
    if (denied) {
      // Staff: hide items without permission entirely (sections are pre-filtered)
      if (isStaff) return null
      return (
        <button
          key={to}
          type="button"
          onClick={() => notify('This feature is not available for your role. Contact your administrator.', 'error')}
          className={`w-full flex items-center gap-3 ${indented ? 'px-3 py-2' : 'px-3.5 py-2.5'} rounded-xl text-sm font-medium text-on-board/30 cursor-not-allowed`}
        >
          <Icon size={indented ? 16 : 18} strokeWidth={2.1} />
          {label}
          <ShieldOff size={14} className="ml-auto opacity-60" aria-label="No permission" />
        </button>
      )
    }
    return (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-3 ${indented ? 'px-3 py-2' : 'px-3.5 py-2.5'} rounded-xl text-sm font-medium transition-colors ${
            isActive || alsoActive?.some((p) => pathname === p || pathname.startsWith(`${p}/`))
              ? 'bg-on-board/10 text-on-board'
              : 'text-on-board/65 hover:text-on-board hover:bg-on-board/5'
          }`
        }
        data-active={isActiveItem(pathname, to, end, alsoActive)}
      >
        <Icon size={indented ? 16 : 18} strokeWidth={2.1} />
        {label}
        {feature && <NavLock feature={feature} />}
        {badge && badges[badge] > 0 && (
          <span className="ml-auto min-w-[1.375rem] text-center rounded-full bg-chalk text-board text-[11px] font-bold px-1.5 py-0.5" aria-label={`${badges[badge]} open`}>
            {badges[badge] > 99 ? '99+' : badges[badge]}
          </span>
        )}
      </NavLink>
    )
  }

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
              <p className="font-display font-semibold text-lg leading-tight truncate max-w-[10rem]" title={(isAdmin || isStaff) ? user?.schoolName : undefined}>{brandTitle}</p>
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
          className="flex-1 min-h-0 overflow-y-auto px-4 mt-2 pb-3 space-y-1"
        >
          {navGroups.map((group, i) => {
            // Flat group (no title) — render items directly
            if (!group.title) {
              return (
                <div key={i} className="space-y-1">
                  {group.items.map(item => renderNavItem(item, false))}
                </div>
              )
            }

            // Collapsible section
            const isExpanded = expandedTitle === group.title
            const SectionIcon = group.icon
            const hasActiveItem = group.items.some(item => isActiveItem(pathname, item.to, item.end, item.alsoActive))

            return (
              <div key={group.title}>
                <button
                  type="button"
                  onClick={() => toggleSection(group.title)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    hasActiveItem
                      ? 'text-on-board bg-on-board/5'
                      : 'text-on-board/65 hover:text-on-board hover:bg-on-board/5'
                  }`}
                >
                  {SectionIcon && <SectionIcon size={18} strokeWidth={2.1} />}
                  {group.title}
                  <ChevronRight
                    size={16}
                    className={`ml-auto opacity-50 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                <div
                  className="grid transition-[grid-template-rows] duration-200 ease-out"
                  style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="ml-3 pl-3 border-l border-on-board/10 space-y-0.5 mt-1">
                      {group.items.map(item => renderNavItem(item, true))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

      </aside>

    </>
  )
}
