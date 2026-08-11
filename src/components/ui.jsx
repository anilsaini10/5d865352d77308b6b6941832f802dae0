import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Badge({ tone = 'neutral', children }) {
  const tones = {
    active: 'bg-board/10 text-board border-board/20',
    invited: 'bg-chalk/25 text-[#8a6d00] border-chalk/50',
    inactive: 'bg-coral/10 text-coral border-coral/25',
    suspended: 'bg-coral/10 text-coral border-coral/25',
    neutral: 'bg-line/40 text-ink/70 border-line',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${tones[tone] || tones.neutral}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  )
}

export function Modal({ open, onClose, title, subtitle, children, wide = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-rise"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative bg-paper rounded-2xl shadow-pop border border-line w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[88vh] overflow-y-auto animate-rise`}
      >
        <div className="sticky top-0 bg-paper/95 backdrop-blur border-b border-line px-6 py-4 flex items-start justify-between rounded-t-2xl">
          <div>
            <h2 id="modal-title" className="font-display text-xl font-semibold text-ink">{title}</h2>
            {subtitle && <p className="text-sm text-ink/60 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-ink/50 hover:text-ink hover:bg-line/40 rounded-full p-1.5 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div role="alertdialog" aria-modal="true" className="relative bg-paper rounded-2xl shadow-pop border border-line w-full max-w-sm p-6 animate-rise">
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink/65 mt-2 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-ink/70 hover:bg-line/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${danger ? 'bg-coral hover:bg-coral/90' : 'bg-board hover:bg-board-light'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-board/5 border border-board/10 flex items-center justify-center mb-4">
          <Icon size={24} className="text-board/60" />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="text-sm text-ink/55 mt-1.5 max-w-sm">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Field({ label, hint, error, children, required }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink/80">
        {label} {required && <span className="text-coral">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <span className="text-xs text-ink/45 mt-1 block">{hint}</span>}
      {error && <span className="text-xs text-coral mt-1 block font-medium">{error}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-board focus:ring-2 focus:ring-board/15 outline-none transition-shadow'
