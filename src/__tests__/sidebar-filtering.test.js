import { describe, it, expect } from 'vitest'
import { NAV_BY_ROLE } from '../components/navigation.js'
import { ROLES } from '../features/auth/roles.js'
import { P } from '../constants/permissions.js'

function can(role, isSuperAdmin, permissions, key) {
  if (isSuperAdmin) return true
  if (role === ROLES.STAFF) return !!permissions[key]
  return permissions[key] !== false
}

function filterNavForStaff(groups, canFn) {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((item) => !item.permission || canFn(item.permission)) }))
    .filter((g) => g.items.length > 0)
}

const STAFF_NAV = NAV_BY_ROLE[ROLES.STAFF]

describe('Sidebar filtering with real nav config', () => {
  it('staff with zero permissions sees only Home + Profile', () => {
    const canFn = (key) => can(ROLES.STAFF, false, {}, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)
    const labels = result.flatMap((g) => g.items.map((i) => i.label))
    expect(labels).toEqual(['Home', 'Profile'])
  })

  it('staff with only feesView sees Home + Finance(Fees) + Profile', () => {
    const perms = { [P.FEES_VIEW]: true }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const labels = result.flatMap((g) => g.items.map((i) => i.label))
    expect(labels).toContain('Fees')
    expect(labels).not.toContain('Salary')
    expect(labels).not.toContain('Classes')
  })

  it('staff with classesView + subjectsView sees Academics section', () => {
    const perms = { [P.CLASSES_VIEW]: true, [P.SUBJECTS_VIEW]: true }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const academics = result.find((g) => g.title === 'Academics')
    expect(academics).toBeDefined()
    expect(academics.items.map((i) => i.label)).toEqual(['Classes', 'Subjects'])
  })

  it('granting all permissions shows all STAFF sections', () => {
    const perms = {}
    for (const item of STAFF_NAV.flatMap((g) => g.items)) {
      if (item.permission) perms[item.permission] = true
    }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)

    const sectionTitles = result.map((g) => g.title).filter(Boolean)
    expect(sectionTitles).toContain('Academics')
    expect(sectionTitles).toContain('People')
    expect(sectionTitles).toContain('Communication')
    expect(sectionTitles).toContain('Requests')
    expect(sectionTitles).toContain('Finance')
    expect(sectionTitles).toContain('Settings')
  })

  it('revoking a granted permission hides only that item', () => {
    const perms = { [P.FEES_VIEW]: true, [P.SALARY_VIEW]: true }
    const canFn1 = (key) => can(ROLES.STAFF, false, perms, key)
    const result1 = filterNavForStaff(STAFF_NAV, canFn1)
    const finance1 = result1.find((g) => g.title === 'Finance')
    expect(finance1.items).toHaveLength(2)

    const perms2 = { [P.FEES_VIEW]: true, [P.SALARY_VIEW]: false }
    const canFn2 = (key) => can(ROLES.STAFF, false, perms2, key)
    const result2 = filterNavForStaff(STAFF_NAV, canFn2)
    const finance2 = result2.find((g) => g.title === 'Finance')
    expect(finance2.items).toHaveLength(1)
    expect(finance2.items[0].label).toBe('Fees')
  })

  it('revoking all items in a section hides the entire section', () => {
    const perms = { [P.FEES_VIEW]: false, [P.SALARY_VIEW]: false }
    const canFn = (key) => can(ROLES.STAFF, false, perms, key)
    const result = filterNavForStaff(STAFF_NAV, canFn)
    const finance = result.find((g) => g.title === 'Finance')
    expect(finance).toBeUndefined()
  })
})

describe('Truthy backend values work for STAFF', () => {
  const cases = [
    [true, true],
    [1, true],
    ['true', true],
    ['yes', true],
    [false, false],
    [0, false],
    ['', false],
    [null, false],
    [undefined, false],
  ]

  it.each(cases)('permission value %p → can()=%p', (value, expected) => {
    const perms = value === undefined ? {} : { [P.FEES_VIEW]: value }
    expect(can(ROLES.STAFF, false, perms, P.FEES_VIEW)).toBe(expected)
  })
})

describe('ADMIN — allow by default, deny on explicit false', () => {
  it('undefined permission → allowed', () => {
    expect(can(ROLES.ADMIN, false, {}, P.FEES_VIEW)).toBe(true)
  })

  it('true permission → allowed', () => {
    expect(can(ROLES.ADMIN, false, { [P.FEES_VIEW]: true }, P.FEES_VIEW)).toBe(true)
  })

  it('false permission → denied', () => {
    expect(can(ROLES.ADMIN, false, { [P.FEES_VIEW]: false }, P.FEES_VIEW)).toBe(false)
  })

  it('null permission → allowed (not strictly false)', () => {
    expect(can(ROLES.ADMIN, false, { [P.FEES_VIEW]: null }, P.FEES_VIEW)).toBe(true)
  })
})
