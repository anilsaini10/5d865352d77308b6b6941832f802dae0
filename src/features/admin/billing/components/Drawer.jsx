import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/** Right-hand side drawer: sticky header (`header`), scrolling body, Esc/backdrop close unless `locked`. */
export default function Drawer({ label, header, onClose, locked = false, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !locked && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, locked])

  // Portalled so it still covers the screen when opened from inside a (transformed) modal.
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={locked ? undefined : onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label={label} className="relative w-full max-w-xl h-full bg-paper border-l border-line shadow-pop overflow-y-auto animate-rise">
        <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-line px-6 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">{header}</div>
          <button onClick={onClose} disabled={locked} className="text-ink/50 hover:text-ink hover:bg-line/40 rounded-full p-1.5 disabled:opacity-40" aria-label="Close"><X size={18} /></button>
        </header>
        <div className="px-6 py-5 space-y-6">{children}</div>
      </aside>
    </div>,
    document.body,
  )
}
