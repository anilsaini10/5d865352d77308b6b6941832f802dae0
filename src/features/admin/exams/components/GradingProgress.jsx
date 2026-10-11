export default function GradingProgress({ graded = 0, total = 0, label = 'graded' }) {
  const pct = total > 0 ? Math.min(100, Math.round((graded / total) * 100)) : 0
  const complete = total > 0 && graded >= total

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
        <span className="text-ink/60">
          <span className="font-semibold text-ink">{graded}</span> of {total} {label}
        </span>
        <span className={complete ? 'text-success font-semibold' : 'text-ink/45'}>{pct}%</span>
      </div>
      <div
        className="h-2 rounded-full bg-line/60 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${graded} of ${total} students ${label}`}
      >
        <div className={`h-full rounded-full transition-all ${complete ? 'bg-success' : 'bg-board'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
