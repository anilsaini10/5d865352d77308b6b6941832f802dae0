import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { fmtPct, fmtCount } from '../analytics.helpers.js'

const ARROWS = {
  UP: { icon: TrendingUp, color: 'text-success' },
  DOWN: { icon: TrendingDown, color: 'text-coral' },
  FLAT: { icon: Minus, color: 'text-ink/40' },
  UNKNOWN: { icon: Minus, color: 'text-ink/40' },
}

export default function TrendStat({ label, value, comparison, isPercentage = false, className = '' }) {
  if (!comparison) {
    return (
      <div className={`bg-surface border border-line rounded-2xl shadow-card p-5 ${className}`}>
        <p className="text-sm text-ink/55">{label}</p>
        <p className="text-2xl font-semibold text-ink mt-1">{value == null ? '—' : isPercentage ? fmtPct(value) : fmtCount(value)}</p>
      </div>
    )
  }

  const { currentValue, previousValue, percentageChange, percentagePointChange, trendDirection, comparable } = comparison
  const display = currentValue == null ? '—' : isPercentage ? fmtPct(currentValue) : fmtCount(currentValue)
  const prev = previousValue == null ? null : isPercentage ? fmtPct(previousValue) : fmtCount(previousValue)
  const arrow = ARROWS[trendDirection] || ARROWS.UNKNOWN
  const ArrowIcon = arrow.icon

  const changeText = comparable === false
    ? 'Not enough data to compare'
    : isPercentage
      ? percentagePointChange != null ? `${percentagePointChange > 0 ? '+' : ''}${percentagePointChange.toFixed(1)} pts` : null
      : percentageChange != null ? `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(1)}%` : null

  return (
    <div className={`bg-surface border border-line rounded-2xl shadow-card p-5 ${className}`}>
      <p className="text-sm text-ink/55">{label}</p>
      <p className="text-2xl font-semibold text-ink mt-1">{display}</p>
      <div className="flex items-center gap-2 mt-2 text-sm">
        {comparable !== false && <ArrowIcon size={14} className={arrow.color} />}
        {changeText && (
          <span className={comparable === false ? 'text-ink/40' : arrow.color}>
            {changeText}
          </span>
        )}
        {prev && comparable !== false && <span className="text-ink/40">vs {prev}</span>}
      </div>
    </div>
  )
}
