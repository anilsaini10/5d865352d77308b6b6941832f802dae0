import { useState } from 'react'
import { AtSign, KeyRound, LogOut } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import { Button, Card, ConfirmDialog } from '../../components/ui.jsx'
import { useAuth } from './AuthContext.jsx'
import { ROLE_LABELS } from './roles.js'
import ChangePasswordModal from './components/ChangePasswordModal.jsx'
import UsernameModal from './components/UsernameModal.jsx'

function Row({ label, value }) {
  return (
    <div className="py-3 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
      <dt className="sm:w-40 text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</dt>
      <dd className="text-sm text-ink break-all">{value || <span className="text-ink/40">—</span>}</dd>
    </div>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [usernameOpen, setUsernameOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
    <AppShell title="Profile" subtitle="Your account details">
      {/* data-paywall-allow: profile actions (incl. log out) must keep working while a paywall is up */}
      <div data-paywall-allow className="max-w-2xl space-y-5">
        <Card className="p-6">
          <div className="flex items-center gap-4 pb-5 border-b border-line">
            <div className="w-14 h-14 rounded-full bg-chalk text-board font-display font-semibold flex items-center justify-center text-xl shrink-0">
              {user?.name?.[0] ?? 'S'}
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold text-ink truncate">{user?.name}</p>
              <p className="text-sm text-ink/60">{ROLE_LABELS[user?.role] ?? user?.role}</p>
            </div>
          </div>
          <dl className="divide-y divide-line">
            <Row label="Username" value={user?.username} />
            <Row label="Email" value={user?.email} />
            <Row label="Phone" value={user?.phone} />
            {user?.schoolName && <Row label="School" value={user.schoolName} />}
          </dl>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" icon={AtSign} onClick={() => setUsernameOpen(true)}>{user?.username ? 'Change username' : 'Set username'}</Button>
          <Button variant="secondary" icon={KeyRound} onClick={() => setPasswordOpen(true)}>Change password</Button>
          <Button variant="danger-ghost" icon={LogOut} onClick={() => setLogoutOpen(true)}>Log out</Button>
        </div>
      </div>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <UsernameModal open={usernameOpen} onClose={() => setUsernameOpen(false)} />
      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={logout}
        title="Log out?"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Log out"
      />
    </AppShell>
  )
}
