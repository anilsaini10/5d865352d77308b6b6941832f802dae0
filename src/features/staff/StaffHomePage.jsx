import { LogOut } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import { Button, Card } from '../../components/ui.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

export default function StaffHomePage() {
  const { user, logout } = useAuth()

  const roleName = user?.customRole?.name ?? 'Staff'

  return (
    <AppShell title={`Welcome, ${user?.name ?? 'User'}`} subtitle={`${roleName} · ${user?.schoolName ?? ''}`}>
      <Card className="p-6 max-w-lg">
        <div className="space-y-4">
          <div className="space-y-2 text-sm text-ink/70">
            <p><span className="font-semibold text-ink">Name:</span> {user?.name}</p>
            <p><span className="font-semibold text-ink">Role:</span> {roleName}</p>
            {user?.email && <p><span className="font-semibold text-ink">Email:</span> {user.email}</p>}
            {user?.schoolName && <p><span className="font-semibold text-ink">School:</span> {user.schoolName}</p>}
          </div>
          <div className="pt-2">
            <Button variant="secondary" icon={LogOut} onClick={logout}>Log out</Button>
          </div>
        </div>
      </Card>
    </AppShell>
  )
}
