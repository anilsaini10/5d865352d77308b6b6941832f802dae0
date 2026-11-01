import { usePermission } from '../hooks/usePermission.js'
import AppShell from './AppShell.jsx'
import { EmptyState } from './ui.jsx'
import { ShieldOff } from 'lucide-react'

export default function PermissionRoute({ perm, children }) {
  const allowed = usePermission(perm)

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
