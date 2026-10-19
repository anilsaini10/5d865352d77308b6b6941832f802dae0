import { formatNumber } from '../../../../utils/format.js'
import { isSunday, monthWeeks, styleOf } from '../calendar.utils.js'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function MiniMonth({ month, dayMap, rangeFrom, rangeTo, selected, onSelect }) {
  const weeks = monthWeeks(month.month)
  return (
    <div className="bg-surface border border-line rounded-2xl p-3">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-display text-sm font-semibold text-ink">{month.label}</h3>
        <span className="text-[11px] text-ink/45">{formatNumber(month.workingDays)} working</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((d, i) => <span key={i} className="text-[10px] text-ink/35">{d}</span>)}
        {weeks.flat().map((day) => {
          if (!day.inMonth || day.key < rangeFrom || day.key > rangeTo) return <span key={day.key} />
          const entries = dayMap.get(day.key)
          const top = entries?.[0]
          const tint = top ? styleOf(top.type).cell : isSunday(day.key) ? 'bg-line/70 text-ink/45' : 'text-ink/75 hover:bg-line/40'
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onSelect(day.key)}
              title={entries?.map((e) => e.title).join(', ') || undefined}
              aria-label={`${day.key}${entries ? `: ${entries.map((e) => e.title).join(', ')}` : ''}`}
              className={`aspect-square rounded-md text-[11px] font-medium flex items-center justify-center ${tint} ${selected === day.key ? 'ring-2 ring-board' : ''}`}
            >
              {Number(day.key.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** All months of the range as mini grids. A day takes the colour of its highest-priority entry. */
export default function YearView({ months, dayMap, range, selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {months.map((m) => (
        <MiniMonth key={m.month} month={m} dayMap={dayMap} rangeFrom={range.from} rangeTo={range.to} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  )
}
