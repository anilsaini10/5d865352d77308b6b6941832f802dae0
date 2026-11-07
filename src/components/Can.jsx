import { usePermissions } from '../hooks/usePermission.js'

export default function Can({ perm, anyOf, allOf, fallback = null, children }) {
  const { can } = usePermissions()

  let allowed = false
  if (perm) allowed = can(perm)
  else if (anyOf) allowed = anyOf.some(can)
  else if (allOf) allowed = allOf.every(can)

  return allowed ? children : fallback
}
