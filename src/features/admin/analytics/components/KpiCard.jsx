import { fmtCount, fmtPct } from '../analytics.helpers.js'

export default function KpiCard({ icon: Icon, label, value, hint, isPercentage, onClick, className = '' }) {
  const display = value == null ? '—' : isPercentage ? fmtPct(value) : fmtCount(value)
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`text-left bg-surface border border-line rounded-2xl shadow-card p-5 flex items-center gap-4 ${onClick ? 'hover:border-board/30 hover:shadow-pop transition-shadow' : ''} ${className}`}
    >
      {Icon && (
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-board/10 text-board">
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-ink/55">{label}</p>
        <p className="text-2xl font-semibold text-ink">{display}</p>
        {hint && <p className="text-xs text-ink/40 mt-0.5">{hint}</p>}
      </div>
    </Tag>
  )
}
