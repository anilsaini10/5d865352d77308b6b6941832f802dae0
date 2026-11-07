import { useCallback } from 'react'
import { useAuth } from '../features/auth/AuthContext.jsx'

export function usePermissions() {
  const { permissions, isSuperAdmin, permissionsLoading, refetchPermissions } = useAuth()

  const can = useCallback(
    (key) => isSuperAdmin || permissions[key] !== false,
    [permissions, isSuperAdmin],
  )

  const value = useCallback(
    (key, fallback) => (key in permissions ? permissions[key] : fallback),
    [permissions],
  )

  return { permissions, loading: permissionsLoading, can, value, refresh: refetchPermissions }
}

export function usePermission(key) {
  const { permissions, isSuperAdmin } = useAuth()
  if (isSuperAdmin) return true
  return permissions[key] !== false
}
