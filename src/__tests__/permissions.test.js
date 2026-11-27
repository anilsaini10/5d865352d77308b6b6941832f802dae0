import { describe, it, expect } from 'vitest'
import { ROLES } from '../features/auth/roles.js'
import { P } from '../constants/permissions.js'

// ---------- Core permission logic (mirrors usePermission.js) ----------

function can(role, isSuperAdmin, permissions, key) {
  if (isSuperAdmin) return true
  if (role === ROLES.STAFF) return !!permissions[key]
  return permissions[key] !== false
}

// ---------- Sidebar filtering logic (mirrors Sidebar.jsx) ----------

function filterNavForStaff(groups, canFn) {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((item) => !item.permission || canFn(item.permission)) }))
    .filter((g) => g.items.length > 0)
}

// ---------- Sample nav structure (matches navigation.js STAFF) ----------

const STAFF_NAV = [
  { title: null, items: [{ to: '/', label: 'Home' }] },
  {
    title: 'Academics',
    items: [
      { to: '/classes', label: 'Classes', permission: P.CLASSES_VIEW },
      { to: '/subjects', label: 'Subjects', permission: P.SUBJECTS_VIEW },
      { to: '/timetable', label: 'Timetable', permission: P.TIMETABLE_VIEW },
      { to: '/exams', label: 'Exams', permission: P.EXAMS_VIEW },
    ],
  },
  {
    title: 'People',
    items: [
      { to: '/students', label: 'Students', permission: P.STUDENTS_VIEW },
      { to: '/teachers', label: 'Teachers', permission: P.TEACHERS_VIEW },
    ],
  },
  {
    title: 'Communication',
    items: [
      { to: '/announcements', label: 'Announcements', permission: P.ANNOUNCEMENTS_VIEW },
      { to: '/events', label: 'Events', permission: P.EVENTS_VIEW },
      { to: '/notifications', label: 'Notifications', permission: P.NOTIFICATIONS_VIEW },
    ],
  },
  {
    title: 'Requests',
    items: [
      { to: '/leave', label: 'Leave requests', permission: P.LEAVE_VIEW },
    ],
  },
  {
    title: 'Finance',
    items: [
      { to: '/salary', label: 'Salary', permission: P.SALARY_VIEW },
      { to: '/fees', label: 'Fees', permission: P.FEES_VIEW },
    ],
  },
  { title: 'Settings', items: [{ to: '/profile', label: 'Profile' }] },
]

// =====================================================================
//  1. can() — SUPER_ADMIN
// =====================================================================

describe('can() — SUPER_ADMIN', () => {
  it('always returns true regardless of permissions', () => {
    expect(can(ROLES.SUPER_ADMIN, true, {}, P.FEES_VIEW)).toBe(true)
    expect(can(ROLES.SUPER_ADMIN, true, {}, P.CLASSES_VIEW)).toBe(true)
    expect(can(ROLES.SUPER_ADMIN, true, { [P.FEES_VIEW]: false }, P.FEES_VIEW)).toBe(true)
  })
})

// =====================================================================
//  2. can() — ADMIN
// =====================================================================

describe('can() — ADMIN', () => {
  it('allows when permission is not set (undefined)', () => {
    expect(can(ROLES.ADMIN, false, {}, P.CLASSES_VIEW)).toBe(true)
  })

  it('allows when permission is true', () => {
    expect(can(ROLES.ADMIN, false, { [P.CLASSES_VIEW]: true }, P.CLASSES_VIEW)).toBe(true)
  })

  it('denies only when permission is explicitly false', () => {
    expect(can(ROLES.ADMIN, false, { [P.CLASSES_VIEW]: false }, P.CLASSES_VIEW)).toBe(false)
  })
})

// =====================================================================
//  3. can() — STAFF (custom roles like Accountant, Receptionist)
// =====================================================================

describe('can() — STAFF (custom roles)', () => {
  it('denies when permission is not set (undefined)', () => {
    expect(can(ROLES.STAFF, false, {}, P.CLASSES_VIEW)).toBe(false)
  })

  it('denies when permission is explicitly false', () => {
    expect(can(ROLES.STAFF, false, { [P.CLASSES_VIEW]: false }, P.CLASSES_VIEW)).toBe(false)
  })

  it('allows when permission is true', () => {
    expect(can(ROLES.STAFF, false, { [P.CLASSES_VIEW]: true }, P.CLASSES_VIEW)).toBe(true)
  })

  it('allows when backend returns 1 (truthy number)', () => {
    expect(can(ROLES.STAFF, false, { [P.FEES_VIEW]: 1 }, P.FEES_VIEW)).toBe(true)
  })

  it('allows when backend returns "true" (truthy string)', () => {
    expect(can(ROLES.STAFF, false, { [P.FEES_VIEW]: 'true' }, P.FEES_VIEW)).toBe(true)
  })

  it('denies when backend returns 0 (falsy)', () => {
    expect(can(ROLES.STAFF, false, { [P.FEES_VIEW]: 0 }, P.FEES_VIEW)).toBe(false)
  })

  it('denies when backend returns null', () => {
    expect(can(ROLES.STAFF, false, { [P.FEES_VIEW]: null }, P.FEES_VIEW)).toBe(false)
  })

  it('denies when backend returns empty string', () => {
    expect(can(ROLES.STAFF, false, { [P.FEES_VIEW]: '' }, P.FEES_VIEW)).toBe(false)
  })
})

// =====================================================================
//  4. Sidebar filtering — STAFF sections visibility
// =====================================================================

describe('Sidebar filtering — STAFF dynamic sections', () => {
  it('shows only Home + Settings when no permissions granted', () => {
    const perms = {}
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const titles = result.map((g) => g.title)
    expect(titles).toEqual([null, 'Settings'])
    expect(result[0].items[0].label).toBe('Home')
    expect(result[1].items[0].label).toBe('Profile')
  })

  it('shows Finance section with only Fees when only feesView granted', () => {
    const perms = { [P.FEES_VIEW]: true }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const titles = result.map((g) => g.title)
    expect(titles).toContain('Finance')
    expect(titles).not.toContain('Academics')
    expect(titles).not.toContain('People')

    const finance = result.find((g) => g.title === 'Finance')
    expect(finance.items.map((i) => i.label)).toEqual(['Fees'])
  })

  it('shows Finance section with both Salary & Fees when both granted', () => {
    const perms = { [P.FEES_VIEW]: true, [P.SALARY_VIEW]: true }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const finance = result.find((g) => g.title === 'Finance')
    expect(finance.items.map((i) => i.label)).toEqual(['Salary', 'Fees'])
  })

  it('shows Academics section with only Classes when only classesView granted', () => {
    const perms = { [P.CLASSES_VIEW]: true }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const titles = result.map((g) => g.title)
    expect(titles).toContain('Academics')

    const academics = result.find((g) => g.title === 'Academics')
    expect(academics.items.map((i) => i.label)).toEqual(['Classes'])
  })

  it('shows Academics with Classes + Subjects when both granted', () => {
    const perms = { [P.CLASSES_VIEW]: true, [P.SUBJECTS_VIEW]: true }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const academics = result.find((g) => g.title === 'Academics')
    expect(academics.items.map((i) => i.label)).toEqual(['Classes', 'Subjects'])
  })

  it('shows multiple sections when permissions span across sections', () => {
    const perms = {
      [P.CLASSES_VIEW]: true,
      [P.STUDENTS_VIEW]: true,
      [P.FEES_VIEW]: true,
      [P.ANNOUNCEMENTS_VIEW]: true,
    }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const titles = result.map((g) => g.title)
    expect(titles).toContain('Academics')
    expect(titles).toContain('People')
    expect(titles).toContain('Communication')
    expect(titles).toContain('Finance')
    expect(titles).not.toContain('Requests')

    expect(result.find((g) => g.title === 'Academics').items.map((i) => i.label)).toEqual(['Classes'])
    expect(result.find((g) => g.title === 'People').items.map((i) => i.label)).toEqual(['Students'])
    expect(result.find((g) => g.title === 'Communication').items.map((i) => i.label)).toEqual(['Announcements'])
    expect(result.find((g) => g.title === 'Finance').items.map((i) => i.label)).toEqual(['Fees'])
  })

  it('shows all sub-items when all permissions in a section granted', () => {
    const perms = {
      [P.CLASSES_VIEW]: true,
      [P.SUBJECTS_VIEW]: true,
      [P.TIMETABLE_VIEW]: true,
      [P.EXAMS_VIEW]: true,
    }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const academics = result.find((g) => g.title === 'Academics')
    expect(academics.items.map((i) => i.label)).toEqual(['Classes', 'Subjects', 'Timetable', 'Exams'])
  })
})

// =====================================================================
//  5. Accountant role — real-world scenario
// =====================================================================

describe('Accountant role scenario', () => {
  it('accountant with fees + salary permissions sees only Finance', () => {
    const perms = { [P.FEES_VIEW]: true, [P.SALARY_VIEW]: true, [P.FEES_COLLECT]: true }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const sectionTitles = result.filter((g) => g.title).map((g) => g.title)
    expect(sectionTitles).toEqual(['Finance', 'Settings'])
  })

  it('accountant with fees + classes sees Finance + Academics', () => {
    const perms = { [P.FEES_VIEW]: true, [P.CLASSES_VIEW]: true }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const sectionTitles = result.filter((g) => g.title).map((g) => g.title)
    expect(sectionTitles).toEqual(['Academics', 'Finance', 'Settings'])
  })
})

// =====================================================================
//  6. Receptionist role — different permission set
// =====================================================================

describe('Receptionist role scenario', () => {
  it('receptionist with student + attendance + announcements sees People + Communication', () => {
    const perms = {
      [P.STUDENTS_VIEW]: true,
      [P.ANNOUNCEMENTS_VIEW]: true,
      [P.EVENTS_VIEW]: true,
    }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const sectionTitles = result.filter((g) => g.title).map((g) => g.title)
    expect(sectionTitles).toEqual(['People', 'Communication', 'Settings'])
    expect(result.find((g) => g.title === 'People').items.map((i) => i.label)).toEqual(['Students'])
  })
})

// =====================================================================
//  7. ADMIN sidebar — NOT filtered (shows everything, locked if denied)
// =====================================================================

describe('ADMIN sidebar — no filtering', () => {
  it('admin sees all items even without explicit permissions (allow-by-default)', () => {
    const perms = {}
    const canFn = (key) => can(ROLES.ADMIN, false, perms, key)
    // Admin nav is NOT filtered — all items remain. Verify can() returns true for unset keys.
    expect(canFn(P.CLASSES_VIEW)).toBe(true)
    expect(canFn(P.FEES_VIEW)).toBe(true)
    expect(canFn(P.SALARY_VIEW)).toBe(true)
  })

  it('admin is denied only when permission is explicitly false', () => {
    const perms = { [P.FEES_VIEW]: false }
    const canFn = (key) => can(ROLES.ADMIN, false, perms, key)
    expect(canFn(P.FEES_VIEW)).toBe(false)
    expect(canFn(P.CLASSES_VIEW)).toBe(true)
  })
})

// =====================================================================
//  8. Edge cases
// =====================================================================

describe('Edge cases', () => {
  it('empty permissions object — staff sees nothing, admin sees everything', () => {
    const perms = {}
    expect(can(ROLES.STAFF, false, perms, P.FEES_VIEW)).toBe(false)
    expect(can(ROLES.ADMIN, false, perms, P.FEES_VIEW)).toBe(true)
  })

  it('permission removed (set to false) — denied for both staff and admin', () => {
    const perms = { [P.FEES_VIEW]: false }
    expect(can(ROLES.STAFF, false, perms, P.FEES_VIEW)).toBe(false)
    expect(can(ROLES.ADMIN, false, perms, P.FEES_VIEW)).toBe(false)
  })

  it('all permissions granted — staff sees all sections', () => {
    const perms = {
      [P.CLASSES_VIEW]: true, [P.SUBJECTS_VIEW]: true, [P.TIMETABLE_VIEW]: true, [P.EXAMS_VIEW]: true,
      [P.STUDENTS_VIEW]: true, [P.TEACHERS_VIEW]: true,
      [P.ANNOUNCEMENTS_VIEW]: true, [P.EVENTS_VIEW]: true, [P.NOTIFICATIONS_VIEW]: true,
      [P.LEAVE_VIEW]: true,
      [P.SALARY_VIEW]: true, [P.FEES_VIEW]: true,
    }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const sectionTitles = result.filter((g) => g.title).map((g) => g.title)
    expect(sectionTitles).toEqual(['Academics', 'People', 'Communication', 'Requests', 'Finance', 'Settings'])
  })

  it('Home and Profile always visible (no permission key)', () => {
    const canFn = (key) => can(ROLES.STAFF, false, {}, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const labels = result.flatMap((g) => g.items.map((i) => i.label))
    expect(labels).toContain('Home')
    expect(labels).toContain('Profile')
    expect(labels).toHaveLength(2)
  })
})
