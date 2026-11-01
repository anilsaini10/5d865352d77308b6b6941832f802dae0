import { EyeOff } from 'lucide-react'

export default function NotTrackedCard({ title, reason }) {
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-ink/5 flex items-center justify-center shrink-0">
          <EyeOff size={18} className="text-ink/30" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-ink">{title}</h3>
            <span className="inline-flex items-center rounded-full bg-ink/8 px-2 py-0.5 text-[11px] font-semibold text-ink/50">
              Not tracked yet
            </span>
          </div>
          {reason && <p className="text-sm text-ink/45 mt-1">{reason}</p>}
        </div>
      </div>
    </div>
  )
}
