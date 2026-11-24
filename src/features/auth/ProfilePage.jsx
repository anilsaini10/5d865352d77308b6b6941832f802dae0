import { useCallback, useRef, useState } from 'react'
import { AtSign, Camera, KeyRound, LogOut, Mail, Phone, School, Shield, User, ChevronRight } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import { Badge, Button, Card, ConfirmDialog, Modal } from '../../components/ui.jsx'
import { useAuth } from './AuthContext.jsx'
import { authApi } from './auth.api.js'
import { ROLE_LABELS } from './roles.js'
import { useToast } from '../../context/ToastContext.jsx'
import ChangePasswordModal from './components/ChangePasswordModal.jsx'
import UsernameModal from './components/UsernameModal.jsx'
import ProfilePhotoCropModal from './components/ProfilePhotoCropModal.jsx'

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-9 h-9 rounded-lg bg-board/8 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={16} className="text-board" />
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">{label}</dt>
        <dd className="text-sm text-ink mt-0.5 break-all">{value || <span className="text-ink/30">Not set</span>}</dd>
      </div>
    </div>
  )
}

function ActionRow({ icon: Icon, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-line/40 transition-colors text-left group"
    >
      <div className="w-9 h-9 rounded-lg bg-line/60 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-ink/60" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-ink/50 mt-0.5">{description}</p>
      </div>
      <ChevronRight size={16} className="text-ink/30 group-hover:text-ink/50 transition-colors shrink-0" />
    </button>
  )
}

export default function ProfilePage() {
  const { user, logout, updateUser, isSuperAdmin } = useAuth()
  const { notify } = useToast()
  const [usernameOpen, setUsernameOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const fileRef = useRef(null)

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result)
      setPreviewOpen(false)
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const handleSaveCroppedPhoto = async (croppedFile) => {
    setUploading(true)
    try {
      const updated = await authApi.uploadProfilePhoto(croppedFile)
      updateUser({ profilePhoto: updated.profilePhoto })
      notify('Profile photo updated.', 'success')
      setCropModalOpen(false)
      setSelectedImage(null)
    } catch {
      notify('Could not upload profile photo. Please try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleReUpload = useCallback(() => {
    setSelectedImage(null)
    setTimeout(() => fileRef.current?.click(), 100)
  }, [])

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role

  return (
    <AppShell title="Profile" subtitle="Your account details">
      {/* data-paywall-allow: profile actions (incl. log out) must keep working while a paywall is up */}
      <div data-paywall-allow className="max-w-3xl space-y-6">

        {/* Hero card */}
        <Card className="relative overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-board/20 via-board/10 to-transparent" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              <button
                type="button"
                className="relative w-20 h-20 rounded-2xl shrink-0 group ring-4 ring-paper shadow-sm"
                onClick={() => setPreviewOpen(true)}
                disabled={uploading}
                aria-label="View profile photo"
              >
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-board text-paper font-display font-semibold flex items-center justify-center text-2xl">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 rounded-2xl bg-ink/0 group-hover:bg-ink/40 flex items-center justify-center transition-colors">
                  <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {uploading && (
                  <div className="absolute inset-0 rounded-2xl bg-ink/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileSelect} />

              <div className="flex-1 min-w-0 sm:pb-1">
                <h2 className="font-display text-xl font-semibold text-ink truncate">{user?.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <Badge tone={isSuperAdmin ? 'info' : 'active'}>{roleLabel}</Badge>
                  {user?.schoolName && (
                    <span className="text-sm text-ink/50">{user.schoolName}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Account info */}
          <Card className="p-5">
            <h3 className="font-display font-semibold text-ink mb-1">Account Information</h3>
            <p className="text-xs text-ink/40 mb-3">Your login and contact details</p>
            <dl className="divide-y divide-line">
              <InfoItem icon={Mail} label="Email" value={user?.email} />
              <InfoItem icon={AtSign} label="Username" value={user?.username} />
              <InfoItem icon={Phone} label="Phone" value={user?.phone} />
            </dl>
          </Card>

          {/* Role & access */}
          <Card className="p-5">
            <h3 className="font-display font-semibold text-ink mb-1">Role & Access</h3>
            <p className="text-xs text-ink/40 mb-3">Your permissions and school assignment</p>
            <dl className="divide-y divide-line">
              <InfoItem icon={Shield} label="Role" value={roleLabel} />
              <InfoItem icon={School} label="School" value={user?.schoolName} />
              <InfoItem icon={User} label="User ID" value={
                <span className="font-mono text-xs text-ink/60">{user?.id}</span>
              } />
            </dl>
          </Card>
        </div>

        {/* Account actions */}
        <Card className="p-2">
          <h3 className="font-display font-semibold text-ink px-4 pt-3 pb-1">Account Settings</h3>
          <p className="text-xs text-ink/40 px-4 mb-2">Manage your account security</p>
          <div className="space-y-0.5">
            <ActionRow
              icon={AtSign}
              label={user?.username ? 'Change username' : 'Set username'}
              description="Update your login username"
              onClick={() => setUsernameOpen(true)}
            />
            <ActionRow
              icon={KeyRound}
              label="Change password"
              description="Update your account password"
              onClick={() => setPasswordOpen(true)}
            />
          </div>
          <div className="border-t border-line mt-1 pt-1 px-1 pb-1">
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-coral/6 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-coral/10 flex items-center justify-center shrink-0">
                <LogOut size={16} className="text-coral" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-coral">Log out</p>
                <p className="text-xs text-ink/50 mt-0.5">Sign out of your account</p>
              </div>
              <ChevronRight size={16} className="text-coral/40 group-hover:text-coral/60 transition-colors shrink-0" />
            </button>
          </div>
        </Card>
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
      {/* Profile photo preview modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Profile Photo">
        <div className="flex flex-col items-center gap-5">
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt={user.name} className="w-48 h-48 rounded-full object-cover ring-4 ring-line shadow-sm" />
          ) : (
            <div className="w-48 h-48 rounded-full bg-board text-paper font-display font-semibold flex items-center justify-center text-5xl ring-4 ring-line shadow-sm">
              {initials}
            </div>
          )}
          <Button
            variant="primary"
            icon={Camera}
            onClick={() => {
              setPreviewOpen(false)
              fileRef.current?.click()
            }}
          >
            Update Photo
          </Button>
        </div>
      </Modal>

      <ProfilePhotoCropModal
        open={cropModalOpen}
        onClose={() => { setCropModalOpen(false); setSelectedImage(null) }}
        imageSrc={selectedImage}
        onSave={handleSaveCroppedPhoto}
        onReUpload={handleReUpload}
      />
    </AppShell>
  )
}
