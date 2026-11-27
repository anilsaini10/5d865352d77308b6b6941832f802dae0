import { useCallback } from 'react'
import { useAuth } from '../features/auth/AuthContext.jsx'
import { ROLES } from '../features/auth/roles.js'

export function usePermissions() {
  const { user, permissions, isSuperAdmin, permissionsLoading, refetchPermissions } = useAuth()
  const role = user?.role

  const can = useCallback(
    (key) => {
      if (isSuperAdmin) return true
      // Staff: only show what was explicitly granted (truthy)
      if (role === ROLES.STAFF) return !!permissions[key]
      // Admin: allow unless explicitly denied
      return permissions[key] !== false
    },
    [permissions, isSuperAdmin, role],
  )

  const value = useCallback(
    (key, fallback) => (key in permissions ? permissions[key] : fallback),
    [permissions],
  )

  return { permissions, loading: permissionsLoading, can, value, refresh: refetchPermissions }
}

export function usePermission(key) {
  const { user, permissions, isSuperAdmin } = useAuth()
  if (isSuperAdmin) return true
  if (user?.role === ROLES.STAFF) return !!permissions[key]
  return permissions[key] !== false
}
