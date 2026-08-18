import { useState } from 'react'
import { CheckCircle2, Copy, Check, X } from 'lucide-react'

export default function AdminCreatedBanner({ admin, defaultPassword, onDismiss }) {
  const [copied, setCopied] = useState(false)

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(defaultPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard access denied — user can still select the text manually
    }
  }

  return (
    <div className="relative bg-board text-paper border border-board-dark rounded-2xl shadow-pop p-5 mb-6 animate-rise">
      <button
        onClick={onDismiss}
        className="absolute right-4 top-4 text-paper/60 hover:text-paper p-1 rounded-full hover:bg-paper/10"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div className="w-9 h-9 rounded-full bg-chalk/90 flex items-center justify-center shrink-0">
          <CheckCircle2 size={18} className="text-board" />
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-lg leading-tight">Admin created</p>
          <p className="text-sm text-paper/70 mt-0.5">
            Share these login details with <span className="font-semibold text-paper">{admin.name}</span> — this
            password won't be shown again.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="bg-paper/10 rounded-lg px-3.5 py-2 font-mono text-sm">{admin.email}</div>
            <div className="flex items-center gap-2 bg-chalk/95 text-board rounded-lg px-3.5 py-2 font-mono text-sm font-bold">
              {defaultPassword}
              <button
                onClick={copyPassword}
                className="text-board/70 hover:text-board"
                aria-label="Copy password"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
