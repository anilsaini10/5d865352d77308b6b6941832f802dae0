import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Modal, Field, inputClass } from '../../../components/ui.jsx'
import { authApi } from '../auth.api.js'
import { validateChangePasswordForm } from '../auth.validation.js'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'
import { useAuth } from '../AuthContext.jsx'

const emptyForm = { currentPassword: '', newPassword: '', confirmPassword: '' }

export default function ChangePasswordModal({ open, onClose }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const close = () => {
    setForm(emptyForm)
    setErrors({})
    setServerError('')
    onClose()
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateChangePasswordForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      await authApi.resetPassword(form.currentPassword, form.newPassword)
      await logout()
      navigate('/login', { replace: true, state: { message: 'Password changed — please log in again.' } })
    } catch (err) {
      if (getErrorCode(err) === 'INVALID_CURRENT_PASSWORD') {
        setErrors({ currentPassword: 'Current password is incorrect.' })
      } else {
        setServerError(getErrorMessage(err, 'Could not change password.'))
      }
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={close} title="Change password" subtitle="You'll be signed out on all devices">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Current password" required error={errors.currentPassword}>
          <input
            type="password"
            className={inputClass}
            value={form.currentPassword}
            onChange={set('currentPassword')}
            autoComplete="current-password"
            autoFocus
          />
        </Field>

        <Field label="New password" required error={errors.newPassword} hint="6-100 characters">
          <input
            type="password"
            className={inputClass}
            value={form.newPassword}
            onChange={set('newPassword')}
            autoComplete="new-password"
          />
        </Field>

        <Field label="Confirm new password" required error={errors.confirmPassword}>
          <input
            type="password"
            className={inputClass}
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            autoComplete="new-password"
          />
        </Field>

        {serverError && (
          <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-3 py-2">
            {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={close}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink/70 hover:bg-line/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-board hover:bg-board-light disabled:opacity-60 text-paper transition-colors"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Change password
          </button>
        </div>
      </form>
    </Modal>
  )
}
