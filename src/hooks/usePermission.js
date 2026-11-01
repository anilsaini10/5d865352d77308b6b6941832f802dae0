import { useAuth } from '../features/auth/AuthContext.jsx'

export function usePermissions() {
  const { permissions } = useAuth()
  return permissions
}

export function usePermission(key, fallback = false) {
  const { permissions, isSuperAdmin } = useAuth()
  if (isSuperAdmin) return true
  return key in permissions ? permissions[key] : fallback
}
