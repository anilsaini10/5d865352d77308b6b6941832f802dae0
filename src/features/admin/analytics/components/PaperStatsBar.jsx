import { fmtCount, fmtPct } from '../analytics.helpers.js'

const SEGMENTS = [
  { key: 'passCount', label: 'Pass', color: 'bg-success' },
  { key: 'failCount', label: 'Fail', color: 'bg-coral' },
  { key: 'absentCount', label: 'Absent', color: 'bg-ink/20' },
  { key: 'pendingCount', label: 'Pending', color: 'bg-chalk' },
]

export default function PaperStatsBar({ data }) {
  if (!data) return null
  const total = SEGMENTS.reduce((s, seg) => s + (data[seg.key] ?? 0), 0)

  return (
    <div>
      {data.averagePercentage != null && (
        <p className="text-sm text-ink/55 mb-2">Average: <span className="font-semibold text-ink">{fmtPct(data.averagePercentage)}</span></p>
      )}
      <div className="flex h-4 rounded-full overflow-hidden bg-line/60">
        {SEGMENTS.map((seg) => {
          const v = data[seg.key] ?? 0
          if (!v || !total) return null
          return (
            <div key={seg.key} className={seg.color} style={{ width: `${(v / total) * 100}%` }} title={`${seg.label}: ${fmtCount(v)}`} />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-2 text-xs">
        {SEGMENTS.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1.5 text-ink/60">
            <span className={`w-2.5 h-2.5 rounded-sm ${seg.color}`} />
            {seg.label}: {fmtCount(data[seg.key])}
            {data[`${seg.key.replace('Count', 'Percentage')}`] != null && ` (${fmtPct(data[seg.key.replace('Count', 'Percentage')])})`}
          </span>
        ))}
      </div>
    </div>
  )
}
