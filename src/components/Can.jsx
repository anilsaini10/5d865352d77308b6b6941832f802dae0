import { usePermission } from '../hooks/usePermission.js'

export default function Can({ perm, fallback = null, children }) {
  const value = usePermission(perm)
  return value ? children : fallback
}
