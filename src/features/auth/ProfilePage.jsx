import { useRef, useState } from 'react'
import { AtSign, Camera, KeyRound, LogOut } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import { Button, Card, ConfirmDialog } from '../../components/ui.jsx'
import { useAuth } from './AuthContext.jsx'
import { authApi } from './auth.api.js'
import { ROLE_LABELS } from './roles.js'
import { useToast } from '../../context/ToastContext.jsx'
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
  const { user, logout, updateUser } = useAuth()
  const { notify } = useToast()
  const [usernameOpen, setUsernameOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const updated = await authApi.uploadProfilePhoto(file)
      updateUser({ profilePhoto: updated.profilePhoto })
      notify('Profile photo updated.', 'success')
    } catch {
      notify('Could not upload profile photo. Please try again.', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <AppShell title="Profile" subtitle="Your account details">
      {/* data-paywall-allow: profile actions (incl. log out) must keep working while a paywall is up */}
      <div data-paywall-allow className="max-w-2xl space-y-5">
        <Card className="p-6">
          <div className="flex items-center gap-4 pb-5 border-b border-line">
            <button
              type="button"
              className="relative w-14 h-14 rounded-full shrink-0 group"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
            >
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-chalk text-board font-display font-semibold flex items-center justify-center text-xl">
                  {user?.name?.[0] ?? 'S'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-ink/0 group-hover:bg-ink/40 flex items-center justify-center transition-colors">
                <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-ink/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoUpload} />
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
