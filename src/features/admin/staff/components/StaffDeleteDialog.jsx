import { useEffect, useState } from 'react'
import { AlertOctagon, Loader2 } from 'lucide-react'
import { inputClass } from '../../../../components/ui.jsx'

/**
 * Staff DELETE is a hard delete, so this is deliberately heavier than the
 * shared ConfirmDialog: the name must be typed to enable the button, and
 * deactivating is offered as the safer alternative.
 */
export default function StaffDeleteDialog({ staff, onClose, onDelete, onDeactivate }) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setTyped('')
    setBusy(false)
  }, [staff])

  useEffect(() => {
    if (!staff) return undefined
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [staff, busy, onClose])

  if (!staff) return null

  const matches = typed.trim().toLowerCase() === staff.name.trim().toLowerCase()
  const isActive = staff.status !== 'INACTIVE'

  const run = async (action) => {
    setBusy(true)
    try {
      await action(staff)
    } finally {
      setBusy(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={busy ? undefined : onClose} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="staff-delete-title"
        className="relative bg-paper rounded-2xl shadow-pop border-2 border-coral/40 w-full max-w-md overflow-hidden animate-rise"
      >
        <div className="bg-coral/10 border-b border-coral/25 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-coral text-white flex items-center justify-center shrink-0">
            <AlertOctagon size={20} />
          </div>
          <div className="min-w-0">
            <h3 id="staff-delete-title" className="font-display text-lg font-semibold text-coral">Permanently delete staff member?</h3>
            <p className="text-xs font-semibold uppercase tracking-wide text-coral/80">This cannot be undone</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 text-sm text-ink/70 leading-relaxed">
          <p>
            <span className="font-semibold text-ink">{staff.name}</span> ({staff.employeeId}) and their entire record — salary,
            experience, joining date and contact details — will be erased permanently. It cannot be restored.
          </p>
          {isActive && (
            <p className="bg-chalk/15 border border-chalk/40 text-chalk-ink rounded-lg px-3 py-2">
              If they've just left, consider <strong>deactivating</strong> instead — the record is kept and can be re-activated later.
            </p>
          )}
          <label className="block">
            <span className="font-semibold text-ink/80">
              Type <span className="font-mono text-coral">{staff.name}</span> to confirm
            </span>
            <input
              className={`${inputClass} mt-1.5`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              autoComplete="off"
              disabled={busy}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-ink/70 hover:bg-line/50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          {isActive && onDeactivate && (
            <button
              onClick={() => run(onDeactivate)}
              disabled={busy}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-line bg-surface text-ink/80 hover:bg-line/40 disabled:opacity-50 transition-colors"
            >
              Deactivate instead
            </button>
          )}
          <button
            onClick={() => run(onDelete)}
            disabled={!matches || busy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-coral hover:bg-coral/90 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  )
}
