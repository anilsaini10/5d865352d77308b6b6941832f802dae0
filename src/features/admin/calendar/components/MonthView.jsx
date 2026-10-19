import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, IconButton } from '../../../../components/ui.jsx'
import { isSunday, monthWeeks, styleOf, weekBars } from '../calendar.utils.js'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_LANES = 3

function Week({ week, month, dayMap, selected, onSelect }) {
  const { bars, laneCount } = weekBars(week, month.entries)
  const shownLanes = Math.min(laneCount, MAX_LANES)
  return (
    <div className="border-b border-line last:border-0">
      <div className="grid grid-cols-7">
        {week.map((day) => {
          const closed = dayMap.get(day.key)?.some((e) => e.schoolClosed)
          const tint = !day.inMonth ? 'text-ink/25 bg-line/10' : closed ? 'bg-coral/20 text-coral' : isSunday(day.key) ? 'bg-line/40 text-ink/60' : 'text-ink'
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onSelect(day.key)}
              className={`px-2 py-1.5 text-left text-xs font-semibold border-r border-line last:border-0 ${tint} ${selected === day.key ? 'ring-2 ring-inset ring-board' : ''}`}
            >
              {Number(day.key.slice(8))}
            </button>
          )
        })}
      </div>
      <div className="px-0.5 pb-1.5 space-y-0.5">
        {Array.from({ length: shownLanes }, (_, lane) => (
          <div key={lane} className="grid grid-cols-7 h-5">
            {bars.filter((b) => b.lane === lane).map((b) => (
              <button
                key={b.entry.id + b.col}
                type="button"
                onClick={() => onSelect(week[b.col - 1].key)}
                title={b.entry.title}
                style={{ gridColumn: `${b.col} / ${b.end}` }}
                className={`truncate text-[11px] font-semibold px-1.5 text-left ${styleOf(b.entry.type).bar} ${b.startsHere ? 'rounded-l-md ml-0.5' : ''} ${b.endsHere ? 'rounded-r-md mr-0.5' : ''}`}
              >
                {b.startsHere || b.col === 1 ? b.entry.title : ''}
              </button>
            ))}
          </div>
        ))}
        {laneCount > MAX_LANES && <p className="text-[10px] text-ink/45 px-1.5">+{bars.filter((b) => b.lane >= MAX_LANES).length} more — select a day</p>}
      </div>
    </div>
  )
}

/** One month with multi-day bars for ranges. `months` is the response's month list. */
export default function MonthView({ months, index, onIndex, dayMap, selected, onSelect }) {
  const month = months[index]
  if (!month) return null
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-line">
        <div className="flex items-center gap-1">
          <IconButton icon={ChevronLeft} label="Previous month" disabled={index === 0} onClick={() => onIndex(index - 1)} />
          <h2 className="font-display text-lg font-semibold text-ink min-w-[9rem] text-center">{month.label}</h2>
          <IconButton icon={ChevronRight} label="Next month" disabled={index === months.length - 1} onClick={() => onIndex(index + 1)} />
        </div>
        <p className="text-sm text-ink/60">
          <span className="font-semibold text-ink">{month.workingDays}</span> working days ·{' '}
          <span className="font-semibold text-ink">{month.schoolClosedDays}</span> school closed ·{' '}
          <span className="font-semibold text-ink">{month.sundays}</span> Sundays
        </p>
      </div>
      <div className="grid grid-cols-7 border-b border-line bg-line/20">
        {WEEKDAYS.map((d) => <span key={d} className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/45">{d}</span>)}
      </div>
      {monthWeeks(month.month).map((week) => (
        <Week key={week[0].key} week={week} month={month} dayMap={dayMap} selected={selected} onSelect={onSelect} />
      ))}
    </Card>
  )
}
