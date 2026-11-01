import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button, ConfirmDialog, Modal } from '../../../../components/ui.jsx'
import { useToast } from '../../../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../../../api/httpClient.js'
import { recoveryApi } from '../recovery.api.js'
import { DEFAULT_PASSWORD, ROLE_LABELS, loginIds, notifyRecoveryChanged } from '../recovery.constants.js'

/**
 * Reset / reject flows with their confirm and result dialogs.
 *
 * `onDone`     called after any outcome that changes the list (success, 409, 404) so the page can refresh
 * `onNotFound` called on 404 so the page can also close the detail drawer
 *
 * Returns { busy, askReset, askReject, dialogs } — render `dialogs` once; disable action buttons while `busy`.
 */
export function useRecoveryActions({ onDone, onNotFound }) {
  const { notify } = useToast()
  const [confirm, setConfirm] = useState(null) // { kind: 'reset' | 'reject', item }
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { account, password }
  const [copied, setCopied] = useState(false)

  const refresh = () => {
    notifyRecoveryChanged()
    onDone?.()
  }

  const run = async () => {
    const { kind, item } = confirm
    setBusy(true)
    try {
      if (kind === 'reset') {
        const res = await recoveryApi.reset(item.id)
        setResult({ account: item.account, password: res?.defaultPassword ?? DEFAULT_PASSWORD })
      } else {
        await recoveryApi.reject(item.id)
        notify('Request rejected', 'success')
      }
      refresh()
    } catch (err) {
      const code = getErrorCode(err)
      const status = err?.response?.status
      if (status === 401 || status === 403) return // the app's session handling takes over
      const known = code === 'RECOVERY_REQUEST_NOT_PENDING' || code === 'RECOVERY_REQUEST_NOT_FOUND'
      notify(known ? getErrorMessage(err) : 'Something went wrong. Please try again.', 'error')
      if (known) refresh()
      if (code === 'RECOVERY_REQUEST_NOT_FOUND') onNotFound?.()
    } finally {
      setBusy(false)
    }
  }

  const closeResult = () => {
    setResult(null)
    setCopied(false)
  }

  const copy = async () => {
    const lines = [`Login ID: ${loginIds(result.account).join(' / ')}`, `Password: ${result.password}`]
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — the details are still on screen
    }
  }

  const account = confirm?.item.account
  const dialogs = (
    <>
      <ConfirmDialog
        open={confirm?.kind === 'reset'}
        onClose={() => setConfirm(null)}
        onConfirm={run}
        danger={false}
        title="Reset password?"
        confirmLabel="Reset Password"
        message={
          account && (
            <>
              Reset password for <strong className="text-ink">{account.name}</strong> ({ROLE_LABELS[account.role] ?? account.role})? Their password will be set
              to <strong className="text-ink">{DEFAULT_PASSWORD}</strong> and they will be logged out of all devices.
            </>
          )
        }
      />
      <ConfirmDialog
        open={confirm?.kind === 'reject'}
        onClose={() => setConfirm(null)}
        onConfirm={run}
        title="Reject request?"
        confirmLabel="Reject"
        message="Reject this request? The user's password will NOT be changed."
      />

      <Modal open={!!result} onClose={closeResult} title="Password reset" subtitle={result ? `For ${result.account.name}` : undefined}>
        {result && (
          <div className="space-y-4">
            <p className="text-sm text-ink/70">
              Password reset. <strong className="text-ink">{result.account.name}</strong> can now log in with:
            </p>
            <dl className="rounded-lg bg-chalk text-board px-4 py-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">Login ID</dt>
                <dd className="font-mono font-bold break-all">{loginIds(result.account).join(' / ')}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">Password</dt>
                <dd className="font-mono text-lg font-bold">{result.password}</dd>
              </div>
            </dl>
            <p className="text-xs text-ink/55">They’ve been logged out everywhere and should change this password after logging in.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" icon={copied ? Check : Copy} onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
              <Button onClick={closeResult}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )

  return {
    busy,
    askReset: (item) => setConfirm({ kind: 'reset', item }),
    askReject: (item) => setConfirm({ kind: 'reject', item }),
    dialogs,
  }
}
