import { useEffect, useState } from 'react'
import { ChevronDown, X, Loader2, Search, AlertTriangle, CheckCircle2, Copy, Check } from 'lucide-react'

export function Badge({ tone = 'neutral', children }) {
  const tones = {
    active: 'bg-board/10 text-board border-board/20',
    invited: 'bg-chalk/25 text-chalk-ink border-chalk/50',
    inactive: 'bg-coral/10 text-coral border-coral/25',
    suspended: 'bg-coral/10 text-coral border-coral/25',
    neutral: 'bg-line/40 text-ink/70 border-line',
    success: 'bg-success/10 text-success border-success/25',
    warning: 'bg-warning/15 text-warning border-warning/30',
    info: 'bg-info/10 text-info border-info/25',
    danger: 'bg-coral/10 text-coral border-coral/25',
    primary: 'bg-board/10 text-board border-board/20',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${tones[tone] || tones.neutral}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  )
}

/** `wide`: false → small, true → medium, 'xl' → large. */
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
        className={`relative bg-paper rounded-2xl shadow-pop border border-line w-full ${wide === 'xl' ? 'max-w-4xl' : wide ? 'max-w-2xl' : 'max-w-md'} max-h-[88vh] overflow-y-auto animate-rise`}
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

/**
 * `onConfirm` may return a promise — the dialog stays open with a spinner
 * until it settles, then closes. Errors are the caller's to surface.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) {
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={busy ? undefined : onClose} />
      <div role="alertdialog" aria-modal="true" className="relative bg-paper rounded-2xl shadow-pop border border-line w-full max-w-sm p-6 animate-rise">
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        <div className="text-sm text-ink/65 mt-2 leading-relaxed">{message}</div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-ink/70 hover:bg-line/50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-colors ${danger ? 'bg-coral hover:bg-coral/90' : 'bg-board hover:bg-board-light'}`}
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
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

export function Section({ title, description, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div>
          <h3 className="font-display font-semibold text-ink">{title}</h3>
          {description && <p className="text-xs text-ink/50 mt-0.5">{description}</p>}
        </div>
        <ChevronDown size={18} className={`text-ink/40 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
      )}
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
  'w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-board focus:ring-2 focus:ring-board/15 outline-none transition-shadow'

export const selectClass = inputClass

const BUTTON_VARIANTS = {
  primary: 'bg-board hover:bg-board-light text-on-board',
  secondary: 'bg-surface border border-line text-ink/80 hover:bg-line/40',
  ghost: 'text-ink/70 hover:bg-line/50',
  danger: 'bg-coral hover:bg-coral/90 text-white',
  'danger-ghost': 'text-coral hover:bg-coral/10',
}

const BUTTON_SIZES = {
  sm: 'text-xs px-2.5 py-1.5 gap-1',
  md: 'text-sm px-4 py-2.5 gap-1.5',
}

export function Button({ variant = 'primary', size = 'md', icon: Icon, loading = false, className = '', children, disabled, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-semibold disabled:opacity-60 transition-colors ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" /> : Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  )
}

export function IconButton({ icon: Icon, label, tone = 'neutral', className = '', ...rest }) {
  const tones = {
    neutral: 'text-ink/40 hover:text-ink hover:bg-line/50',
    danger: 'text-ink/40 hover:text-coral hover:bg-coral/10',
    primary: 'text-ink/40 hover:text-board hover:bg-board/10',
  }
  return (
    <button type="button" aria-label={label} title={label} className={`rounded-lg p-1.5 transition-colors ${tones[tone]} ${className}`} {...rest}>
      <Icon size={15} />
    </button>
  )
}

/** Inline message box. tone: 'error' | 'info' | 'success' | 'warning'. */
export function Alert({ tone = 'error', children, className = '' }) {
  if (!children) return null
  const tones = {
    error: 'text-coral bg-coral/8 border-coral/20',
    info: 'text-board bg-board/8 border-board/20',
    success: 'text-success bg-success/10 border-success/25',
    warning: 'text-chalk-ink bg-chalk/15 border-chalk/40',
  }
  return <div className={`text-sm font-medium border rounded-lg px-3 py-2 ${tones[tone]} ${className}`}>{children}</div>
}

export function PageLoader({ className = 'py-16' }) {
  return (
    <div className={`flex items-center justify-center text-ink/40 ${className}`}>
      <Loader2 size={22} className="animate-spin" />
    </div>
  )
}

export function Card({ className = '', children }) {
  return <div className={`bg-surface border border-line rounded-2xl shadow-card ${className}`}>{children}</div>
}

/**
 * Standard list body: spinner while loading, error text, empty state, or
 * the children. Saves every list page repeating the same ternary.
 */
export function AsyncContent({ loading, error, empty, emptyState, children }) {
  if (loading) return <PageLoader />
  if (error) return <div className="p-6 text-sm text-coral font-medium">{error}</div>
  if (empty) return emptyState
  return children
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className = 'max-w-sm' }) {
  return (
    <div className={`relative flex-1 ${className}`}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-10`}
      />
    </div>
  )
}

/** Segmented control. options: [{ value, label, count? }] */
export function Tabs({ options, value, onChange, className = '' }) {
  return (
    <div role="tablist" className={`inline-flex gap-1 p-1 bg-surface border border-line rounded-xl ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
            value === o.value ? 'bg-board text-on-board' : 'text-ink/60 hover:text-ink hover:bg-line/40'
          }`}
        >
          {o.label}
          {o.count != null && <span className="ml-1.5 opacity-70">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export const RECORD_STATUS = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', ALL: 'ALL' }

// "All" always comes first in filter tabs across the app.
const STATUS_FILTER_OPTIONS = [
  { value: RECORD_STATUS.ALL, label: 'All' },
  { value: RECORD_STATUS.ACTIVE, label: 'Active' },
  { value: RECORD_STATUS.INACTIVE, label: 'Deleted' },
]

/** The shared Active / Deleted / All filter used by students, teachers and staff lists. */
export function StatusFilter({ value, onChange, inactiveLabel = 'Deleted' }) {
  const options = STATUS_FILTER_OPTIONS.map((o) => (o.value === RECORD_STATUS.INACTIVE ? { ...o, label: inactiveLabel } : o))
  return <Tabs options={options} value={value} onChange={onChange} />
}

export function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${className}`}>{children}</table>
    </div>
  )
}

export function Th({ children, className = '' }) {
  return <th className={`px-5 py-3 font-semibold text-left text-xs uppercase tracking-wide text-ink/45 whitespace-nowrap ${className}`}>{children}</th>
}

export function Td({ children, className = '' }) {
  return <td className={`px-5 py-3.5 text-ink/70 ${className}`}>{children}</td>
}

export function THead({ children }) {
  return (
    <thead>
      <tr className="border-b border-line">{children}</tr>
    </thead>
  )
}

export function Tr({ children, className = '', ...rest }) {
  return (
    <tr className={`border-b border-line last:border-0 ${className}`} {...rest}>
      {children}
    </tr>
  )
}

/** Cancel + submit row at the bottom of a modal form. */
export function FormActions({ onCancel, submitting, submitLabel = 'Save', cancelLabel = 'Cancel' }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
      <Button type="submit" loading={submitting}>{submitLabel}</Button>
    </div>
  )
}

/**
 * Shown once after creating an account that logs in with a default
 * password (teacher, parent). The password is never retrievable later.
 */
export function CredentialsBanner({ title, description, loginId, password, onDismiss, children }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard access denied — the text is still selectable
    }
  }

  return (
    <div className="relative bg-board text-on-board border border-board-dark rounded-2xl shadow-pop p-5 mb-6 animate-rise">
      {onDismiss && (
        <button onClick={onDismiss} className="absolute right-4 top-4 text-on-board/60 hover:text-on-board p-1 rounded-full hover:bg-on-board/10" aria-label="Dismiss">
          <X size={16} />
        </button>
      )}
      <div className="flex items-start gap-3 pr-8">
        <div className="w-9 h-9 rounded-full bg-chalk/90 flex items-center justify-center shrink-0">
          <CheckCircle2 size={18} className="text-board" />
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-lg leading-tight">{title}</p>
          {description && <p className="text-sm text-on-board/70 mt-0.5">{description}</p>}
          {password && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {loginId && <div className="bg-on-board/10 rounded-lg px-3.5 py-2 font-mono text-sm">{loginId}</div>}
              <div className="flex items-center gap-2 bg-chalk text-board rounded-lg px-3.5 py-2 font-mono text-base font-bold">
                {password}
                <button onClick={copy} className="text-board/70 hover:text-board" aria-label="Copy password">
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

export function WarningNote({ children }) {
  return (
    <div className="flex items-start gap-2 text-sm text-chalk-ink bg-chalk/15 border border-chalk/40 rounded-lg px-3 py-2">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}
