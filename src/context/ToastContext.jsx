import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

const STYLES = {
  success: 'bg-board text-paper border-board-dark',
  error: 'bg-coral text-white border-coral',
  info: 'bg-white text-ink border-line',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const notify = useCallback((message, type = 'info') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => dismiss(id), 3200)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info
          return (
            <div
              key={t.id}
              className={`animate-toast flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-pop max-w-sm ${STYLES[t.type]}`}
              role="status"
            >
              <Icon size={18} className="shrink-0" />
              <p className="text-sm font-medium leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-1 opacity-70 hover:opacity-100 shrink-0"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
