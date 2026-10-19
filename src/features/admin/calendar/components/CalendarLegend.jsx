import { EVENT_TYPES } from '../../constants.js'
import { styleOf } from '../calendar.utils.js'

export default function CalendarLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink/65" aria-label="Legend">
      {EVENT_TYPES.map((t) => (
        <li key={t.value} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-sm ${styleOf(t.value).dot}`} aria-hidden="true" />
          {t.label}
        </li>
      ))}
      <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-line/80" aria-hidden="true" />Sunday</li>
    </ul>
  )
}
