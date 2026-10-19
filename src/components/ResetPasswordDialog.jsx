import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button, ConfirmDialog, Modal } from './ui.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../api/httpClient.js'

const DEFAULT_PASSWORD = '123456'

/**
 * Confirm → reset → success modal showing the new default password with a Copy button.
 *
 * `target`   { id, name, note? } or null (closed)
 * `request`  (id) => Promise<{ defaultPassword?: string }>
 * `onStale`  called on 404 so the caller can refresh its list
 * `staleCodes` error codes that mean "that account is gone" (default USER_NOT_FOUND / ADMIN_NOT_FOUND)
 */
export default function ResetPasswordDialog({ target, request, onClose, onStale }) {
  const { notify } = useToast()
  const [result, setResult] = useState(null)
  const succeeded = useRef(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!target) {
      setResult(null)
      succeeded.current = false
      setCopied(false)
    }
  }, [target])

  const confirm = async () => {
    try {
      const res = await request(target.id)
      succeeded.current = true
      setResult({ name: target.name, password: res?.defaultPassword ?? DEFAULT_PASSWORD })
    } catch (err) {
      const code = getErrorCode(err)
      const status = err?.response?.status
      notify(getErrorMessage(err, 'Could not reset the password.'), 'error')
      if (status === 404 || code === 'USER_NOT_FOUND' || code === 'ADMIN_NOT_FOUND') onStale?.()
    }
  }

  // ConfirmDialog calls onClose after confirming; when it succeeded we keep the target for the result modal.
  const closeConfirm = () => {
    if (!succeeded.current) onClose()
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — the password is still on screen
    }
  }

  return (
    <>
      <ConfirmDialog
        open={!!target && !result}
        onClose={closeConfirm}
        onConfirm={confirm}
        danger={false}
        title="Reset password?"
        confirmLabel="Reset password"
        message={
          target && (
            <>
              Reset <strong className="text-ink">{target.name}</strong>’s password to <strong className="text-ink">{DEFAULT_PASSWORD}</strong>? They will be
              logged out on all devices.
              {target.note && <span className="block mt-2 text-ink/55">{target.note}</span>}
            </>
          )
        }
      />

      <Modal open={!!result} onClose={onClose} title="Password reset" subtitle={result ? `For ${result.name}` : undefined}>
        {result && (
          <div className="space-y-4">
            <p className="text-sm text-ink/70">
              Password reset for <strong className="text-ink">{result.name}</strong>. New password:
            </p>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-chalk text-board px-4 py-3 font-mono text-lg font-bold">
              {result.password}
              <button type="button" onClick={copy} className="text-board/70 hover:text-board" aria-label="Copy password">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <p className="text-xs text-ink/55">Ask them to change it after logging in. They’ve been logged out everywhere.</p>
            <div className="flex justify-end"><Button onClick={onClose}>Done</Button></div>
          </div>
        )}
      </Modal>
    </>
  )
}
