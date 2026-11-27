import { describe, it, expect } from 'vitest'
import { NAV_BY_ROLE } from '../components/navigation.js'
import { ROLES } from '../features/auth/roles.js'
import { P } from '../constants/permissions.js'

describe('NAV_BY_ROLE — structure integrity', () => {
  it('has entries for all three roles', () => {
    expect(NAV_BY_ROLE).toHaveProperty(ROLES.SUPER_ADMIN)
    expect(NAV_BY_ROLE).toHaveProperty(ROLES.ADMIN)
    expect(NAV_BY_ROLE).toHaveProperty(ROLES.STAFF)
  })

  it('every permission key in nav references a valid P constant', () => {
    const validKeys = new Set(Object.values(P))
    for (const [role, groups] of Object.entries(NAV_BY_ROLE)) {
      for (const group of groups) {
        for (const item of group.items) {
          if (item.permission) {
            expect(validKeys.has(item.permission), `${role} nav item "${item.label}" uses unknown permission "${item.permission}"`).toBe(true)
          }
        }
      }
    }
  })

  it('every nav item has a "to" and a "label"', () => {
    for (const [role, groups] of Object.entries(NAV_BY_ROLE)) {
      for (const group of groups) {
        for (const item of group.items) {
          expect(item.to, `${role} item missing "to"`).toBeTruthy()
          expect(item.label, `${role} item at ${item.to} missing "label"`).toBeTruthy()
        }
      }
    }
  })

  it('no duplicate routes within the same role', () => {
    for (const [role, groups] of Object.entries(NAV_BY_ROLE)) {
      const routes = groups.flatMap((g) => g.items.map((i) => i.to))
      const unique = new Set(routes)
      expect(routes.length, `${role} has duplicate routes`).toBe(unique.size)
    }
  })
})

describe('STAFF nav — permission gating', () => {
  const staffGroups = NAV_BY_ROLE[ROLES.STAFF]
  const staffItems = staffGroups.flatMap((g) => g.items)

  it('Home and Profile have no permission requirement', () => {
    const home = staffItems.find((i) => i.label === 'Home')
    const profile = staffItems.find((i) => i.label === 'Profile')
    expect(home).toBeDefined()
    expect(profile).toBeDefined()
    expect(home.permission).toBeUndefined()
    expect(profile.permission).toBeUndefined()
  })

  it('all other STAFF items require a permission', () => {
    const gated = staffItems.filter((i) => i.label !== 'Home' && i.label !== 'Profile')
    for (const item of gated) {
      expect(item.permission, `STAFF item "${item.label}" should have a permission key`).toBeTruthy()
    }
  })

  it('STAFF Finance section has Salary and Fees', () => {
    const finance = staffGroups.find((g) => g.title === 'Finance')
    expect(finance).toBeDefined()
    const labels = finance.items.map((i) => i.label)
    expect(labels).toContain('Salary')
    expect(labels).toContain('Fees')
  })

  it('STAFF Academics section has Classes, Subjects, Timetable, Exams, Calendar', () => {
    const academics = staffGroups.find((g) => g.title === 'Academics')
    expect(academics).toBeDefined()
    const labels = academics.items.map((i) => i.label)
    expect(labels).toContain('Classes')
    expect(labels).toContain('Subjects')
    expect(labels).toContain('Timetable')
    expect(labels).toContain('Exams')
    expect(labels).toContain('Academic Calendar')
  })
})

describe('ADMIN nav — permission coverage', () => {
  const adminGroups = NAV_BY_ROLE[ROLES.ADMIN]
  const adminItems = adminGroups.flatMap((g) => g.items)

  it('Dashboard has no permission (always visible)', () => {
    const dashboard = adminItems.find((i) => i.label === 'Dashboard' && i.to === '/')
    expect(dashboard).toBeDefined()
    expect(dashboard.permission).toBeUndefined()
  })

  it('Profile and Help have no permission', () => {
    const profile = adminItems.find((i) => i.label === 'Profile')
    const help = adminItems.find((i) => i.label === 'Help & Support')
    expect(profile?.permission).toBeUndefined()
    expect(help?.permission).toBeUndefined()
  })

  it('ADMIN nav sections match STAFF sections (STAFF is a subset)', () => {
    const staffSections = new Set(staffGroups.filter((g) => g.title).map((g) => g.title))
    const adminSections = new Set(adminGroups.filter((g) => g.title).map((g) => g.title))

    for (const section of staffSections) {
      if (section === 'Settings') continue
      expect(adminSections.has(section), `STAFF has "${section}" section but ADMIN does not`).toBe(true)
    }
  })
})

const staffGroups = NAV_BY_ROLE[ROLES.STAFF]
