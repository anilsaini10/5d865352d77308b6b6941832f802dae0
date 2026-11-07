import { usePermissions } from '../hooks/usePermission.js'
import AppShell from './AppShell.jsx'
import { EmptyState, PageLoader } from './ui.jsx'
import { ShieldOff } from 'lucide-react'

export default function PermissionRoute({ perm, anyOf, allOf, children }) {
  const { can, loading, permissions } = usePermissions()

  let allowed = false
  if (perm) allowed = can(perm)
  else if (anyOf) allowed = anyOf.some(can)
  else if (allOf) allowed = allOf.every(can)

  const hasCache = Object.keys(permissions).length > 0

  if (loading && !hasCache) return <PageLoader />

  if (!allowed) {
    return (
      <AppShell title="Access denied">
        <div className="bg-surface border border-line rounded-2xl shadow-card">
          <EmptyState
            icon={ShieldOff}
            title="You don't have access"
            message="This feature is not available for your account. Contact your administrator if you believe this is a mistake."
          />
        </div>
      </AppShell>
    )
  }

  return children
}
