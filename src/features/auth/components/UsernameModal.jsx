import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal, Field, inputClass, Alert, ConfirmDialog } from '../../../components/ui.jsx'
import { authApi } from '../auth.api.js'
import { useAuth } from '../AuthContext.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'
import { tokenStorage } from '../../../api/tokenStorage.js'
import { validateUsername } from '../../../utils/username.js'

export default function UsernameModal({ open, onClose }) {
  const { user } = useAuth()
  const { notify } = useToast()

  const currentUsername = user?.username || ''
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    if (open) {
      setValue(currentUsername)
      setError('')
      setServerError('')
    }
  }, [open, currentUsername])

  const updateStored = (updatedUser) => {
    const merged = { ...user, ...updatedUser }
    tokenStorage.setUser(merged)
    window.location.reload()
  }

  const save = async (e) => {
    e.preventDefault()
    setServerError('')
    const trimmed = value.trim().toLowerCase()
    const validationError = validateUsername(trimmed)
    if (validationError) {
      setError(validationError)
      return
    }
    if (trimmed === currentUsername) {
      onClose()
      return
    }
    setSubmitting(true)
    try {
      const result = await authApi.updateUsername(trimmed)
      updateStored(result.user)
      notify('Username updated.', 'success')
      onClose()
    } catch (err) {
      const code = getErrorCode(err)
      const message = getErrorMessage(err, 'Could not update username.')
      if (code === 'USERNAME_TAKEN') setError('This username is already taken.')
      else if (code === 'VALIDATION_ERROR' && message.startsWith('username:')) setError(message.replace(/^username:\s*/, ''))
      else setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async () => {
    setSubmitting(true)
    try {
      const result = await authApi.updateUsername(null)
      updateStored(result.user)
      notify('Username removed.', 'success')
      onClose()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not remove username.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Username" subtitle="You can log in with this username instead of your email">
        <form onSubmit={save} className="space-y-4">
          <div className="text-sm text-ink/55">
            Current: <span className="font-mono font-semibold text-ink">{currentUsername || 'Not set'}</span>
          </div>

          <Field label="Username" error={error} hint="3-30 characters · Starts with a letter · Saved in lowercase">
            <input
              className={inputClass}
              value={value}
              onChange={(e) => { setValue(e.target.value); setError('') }}
              onBlur={() => setValue((v) => v.trim().toLowerCase())}
              placeholder="your.username"
              autoFocus
            />
          </Field>

          <Alert>{serverError}</Alert>

          <div className="flex items-center justify-between pt-2">
            <div>
              {currentUsername && (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(true)}
                  disabled={submitting}
                  className="text-sm font-semibold text-coral hover:text-coral/80 transition-colors"
                >
                  Remove username
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink/70 hover:bg-line/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !value.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-board hover:bg-board-light disabled:opacity-60 text-paper transition-colors"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={remove}
        title="Remove username?"
        message="You'll no longer be able to log in with your username. You can set a new one later."
        confirmLabel="Remove"
      />
    </>
  )
}
