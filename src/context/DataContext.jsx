import { createContext, useContext, useEffect, useState } from 'react'
import { seedSchools, seedAdmins } from '../data/seed.js'

const DataContext = createContext(null)

const SCHOOLS_KEY = 'vidyalaya_schools'
const ADMINS_KEY = 'vidyalaya_admins'

function loadOrSeed(key, seed) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fall through to reseed */
  }
  localStorage.setItem(key, JSON.stringify(seed))
  return seed
}

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function DataProvider({ children }) {
  const [schools, setSchools] = useState(() => loadOrSeed(SCHOOLS_KEY, seedSchools))
  const [admins, setAdmins] = useState(() => loadOrSeed(ADMINS_KEY, seedAdmins))

  useEffect(() => {
    localStorage.setItem(SCHOOLS_KEY, JSON.stringify(schools))
  }, [schools])

  useEffect(() => {
    localStorage.setItem(ADMINS_KEY, JSON.stringify(admins))
  }, [admins])

  // ---- Schools ----
  const addSchool = (data) => {
    const school = {
      id: makeId('sch'),
      status: 'active',
      students: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      ...data,
    }
    setSchools((prev) => [school, ...prev])
    return school
  }

  const updateSchool = (id, patch) => {
    setSchools((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const deleteSchool = (id) => {
    setSchools((prev) => prev.filter((s) => s.id !== id))
    // Unassign any admins pointed at this school
    setAdmins((prev) => prev.map((a) => (a.schoolId === id ? { ...a, schoolId: null } : a)))
  }

  // ---- Admins ----
  const addAdmin = (data) => {
    const admin = {
      id: makeId('adm'),
      status: 'invited',
      createdAt: new Date().toISOString().slice(0, 10),
      ...data,
    }
    setAdmins((prev) => [admin, ...prev])
    return admin
  }

  const updateAdmin = (id, patch) => {
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  const deleteAdmin = (id) => {
    setAdmins((prev) => prev.filter((a) => a.id !== id))
  }

  const assignAdmin = (adminId, schoolId) => {
    setAdmins((prev) => prev.map((a) => (a.id === adminId ? { ...a, schoolId } : a)))
  }

  const value = {
    schools,
    admins,
    addSchool,
    updateSchool,
    deleteSchool,
    addAdmin,
    updateAdmin,
    deleteAdmin,
    assignAdmin,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
