import { formatNumber } from '../../../../utils/format.js'

/**
 * Small dependency-free SVG/HTML charts. Colours come from the theme tokens through Tailwind
 * classes (`success`, `warning`, …), so they follow the palette in src/theme/theme.js.
 * Each segment/row is { key, label, value, tone } where `tone` is a Tailwind colour name.
 */

// Tailwind needs full class names in source to generate them.
const STROKE = {
  success: 'stroke-success', warning: 'stroke-warning', info: 'stroke-info', coral: 'stroke-coral',
  board: 'stroke-board', chalk: 'stroke-chalk', muted: 'stroke-ink/25', track: 'stroke-line',
}
const FILL = {
  success: 'fill-success', warning: 'fill-warning', info: 'fill-info', coral: 'fill-coral',
  board: 'fill-board', chalk: 'fill-chalk', muted: 'fill-ink/25', track: 'fill-line',
}
const BG = {
  success: 'bg-success', warning: 'bg-warning', info: 'bg-info', coral: 'bg-coral',
  board: 'bg-board', chalk: 'bg-chalk', muted: 'bg-ink/25', track: 'bg-line',
}

const R = 40
const C = 2 * Math.PI * R
const GAP = 2

function Swatch({ tone }) {
  return <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${BG[tone]}`} aria-hidden="true" />
}

export function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`bg-surface border border-line rounded-2xl shadow-card p-5 ${className}`}>
      <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      {subtitle && <p className="text-xs text-ink/50 mt-0.5">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Donut with the total in the centre and a legend (value + share) beside it. */
export function DonutChart({ segments, centerLabel = 'Total', emptyText = 'No data yet' }) {
  const shown = segments.filter((s) => s.value > 0)
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const summary = segments.map((s) => `${s.label} ${s.value}`).join(', ')

  let offset = 0
  const arcs = shown.map((s) => {
    const len = (s.value / total) * C
    const dash = Math.max(0, len - (shown.length > 1 ? GAP : 0))
    const arc = { ...s, dash, offset }
    offset += len
    return arc
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" role="img" aria-label={total > 0 ? summary : emptyText}>
          <circle cx="50" cy="50" r={R} fill="none" strokeWidth="14" className={STROKE.track} />
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx="50" cy="50" r={R} fill="none" strokeWidth="14"
              strokeDasharray={`${a.dash} ${C - a.dash}`}
              strokeDashoffset={-a.offset}
              className={`${STROKE[a.tone]} transition-opacity hover:opacity-80`}
            >
              <title>{`${a.label}: ${formatNumber(a.value)} (${Math.round((a.value / total) * 100)}%)`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {total > 0 ? (
            <>
              <span className="font-display text-2xl font-semibold text-ink leading-none">{formatNumber(total)}</span>
              <span className="text-[11px] text-ink/50 mt-1">{centerLabel}</span>
            </>
          ) : (
            <span className="text-xs text-ink/45 text-center px-4">{emptyText}</span>
          )}
        </div>
      </div>

      <ul className="w-full sm:flex-1 space-y-2 text-sm" aria-label="Legend">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <Swatch tone={s.tone} />
            <span className="text-ink/70">{s.label}</span>
            <span className="ml-auto font-semibold text-ink tabular-nums">{formatNumber(s.value)}</span>
            <span className="w-10 text-right text-xs text-ink/45 tabular-nums">{total > 0 ? `${Math.round((s.value / total) * 100)}%` : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Horizontal bars scaled to the largest value, with the value printed at the end of each bar. */
export function BarList({ rows, onRowClick }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-3" aria-label="Bar chart">
      {rows.map((r) => {
        const Row = onRowClick ? 'button' : 'div'
        return (
          <li key={r.key}>
            <Row type={onRowClick ? 'button' : undefined} onClick={onRowClick ? () => onRowClick(r) : undefined} className="w-full text-left group">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-ink/70 group-hover:text-ink">{r.label}</span>
                <span className="font-semibold text-ink tabular-nums">{formatNumber(r.value)}</span>
              </div>
              <div className="h-3 rounded-full bg-line/60 overflow-hidden" role="img" aria-label={`${r.label}: ${r.value}`}>
                <div className={`h-full rounded-full ${BG[r.tone]}`} style={{ width: `${(r.value / max) * 100}%` }} title={`${r.label}: ${formatNumber(r.value)}`} />
              </div>
            </Row>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Vertical stacked columns, one per category. `categories`: [{ key, label, parts: {segmentKey: value} }];
 * `segments`: [{ key, label, tone }] in stacking order (bottom → top).
 */
export function StackedColumns({ categories, segments }) {
  const max = Math.max(1, ...categories.map((c) => segments.reduce((s, seg) => s + (c.parts[seg.key] ?? 0), 0)))
  const W = 44
  const GAPX = 14
  const H = 150
  const width = categories.length * (W + GAPX) + GAPX
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t))

  return (
    <div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink/65 mb-3" aria-label="Legend">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5"><Swatch tone={s.tone} />{s.label}</li>
        ))}
      </ul>
      <div className="overflow-x-auto">
        <svg width={Math.max(width + 34, 280)} height={H + 36} role="img" aria-label="Stacked column chart" className="text-ink/45">
          {ticks.map((t) => {
            const y = H - (t / max) * H
            return (
              <g key={t}>
                <line x1="34" x2={width + 34} y1={y} y2={y} className="stroke-line" strokeWidth="1" />
                <text x="28" y={y + 3} textAnchor="end" fontSize="10" fill="currentColor">{t}</text>
              </g>
            )
          })}
          {categories.map((c, i) => {
            const x = 34 + GAPX + i * (W + GAPX)
            let y = H
            return (
              <g key={c.key}>
                {segments.map((s) => {
                  const v = c.parts[s.key] ?? 0
                  if (!v) return null
                  const h = (v / max) * H
                  y -= h
                  return (
                    <rect key={s.key} x={x} y={y} width={W} height={Math.max(0, h - 1)} rx="3" className={`${FILL[s.tone]} hover:opacity-80`}>
                      <title>{`${c.label} · ${s.label}: ${formatNumber(v)}`}</title>
                    </rect>
                  )
                })}
                <text x={x + W / 2} y={H + 16} textAnchor="middle" fontSize="11" fill="currentColor">{c.label.length > 8 ? `${c.label.slice(0, 7)}…` : c.label}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
