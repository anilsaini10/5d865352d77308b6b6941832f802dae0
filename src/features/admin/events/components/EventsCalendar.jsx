import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react'
import { Alert, Badge, Button, Card, IconButton, PageLoader } from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { formatDate, toDateInput, todayInput } from '../../../../utils/format.js'
import { AUDIENCE_LABELS } from '../../constants.js'
import { eventsApi } from '../events.api.js'
import { TONE_CHIP, TONE_DOT, addDays, dayKey, eventTypeMeta, formatEventRange, parseDayKey } from './eventUtils.js'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_CHIPS = 3

async function fetchAllEvents(from, to) {
  const first = await eventsApi.list({ page: 1, pageSize: 100, from, to })
  const items = [...first.items]
  for (let p = 2; p <= first.totalPages; p += 1) {
    const next = await eventsApi.list({ page: p, pageSize: 100, from, to })
    items.push(...next.items)
  }
  return items
}

function buildGrid(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const start = addDays(first, -((first.getDay() + 6) % 7))
  const end = addDays(last, 6 - ((last.getDay() + 6) % 7))
  const days = []
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d)
  return { days, from: toDateInput(start), to: toDateInput(end) }
}

/** Groups events by every visible day they cover. */
function indexByDay(events, from, to) {
  const map = {}
  for (const ev of events) {
    const start = dayKey(ev.startDate)
    const end = dayKey(ev.endDate) || start
    if (!start) continue
    let key = start < from ? from : start
    const stop = end > to ? to : end
    while (key <= stop) {
      ;(map[key] ||= []).push(ev)
      key = toDateInput(addDays(parseDayKey(key), 1))
    }
  }
  return map
}

export default function EventsCalendar({ refreshKey, onOpenEvent, onCreateOnDay }) {
  const today = todayInput()
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selected, setSelected] = useState(today)

  const { days, from, to } = useMemo(() => buildGrid(month), [month])

  const { data, loading, error } = useFetch(() => fetchAllEvents(from, to), [from, to, refreshKey], {
    errorMessage: 'Could not load events.',
  })

  const byDay = useMemo(() => indexByDay(data ?? [], from, to), [data, from, to])
  const selectedEvents = byDay[selected] ?? []

  const shiftMonth = (n) => {
    const next = new Date(month.getFullYear(), month.getMonth() + n, 1)
    setMonth(next)
    setSelected(toDateInput(next))
  }
  const goToday = () => {
    const now = new Date()
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelected(today)
  }

  const monthLabel = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-line">
          <h2 className="font-display text-lg font-semibold text-ink">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={goToday}>Today</Button>
            <IconButton icon={ChevronLeft} label="Previous month" onClick={() => shiftMonth(-1)} />
            <IconButton icon={ChevronRight} label="Next month" onClick={() => shiftMonth(1)} />
          </div>
        </div>

        {error && <Alert className="m-4">{error}</Alert>}

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-surface/60">
              <PageLoader className="h-full" />
            </div>
          )}
          <div className="grid grid-cols-7 border-b border-line">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-1 sm:px-2 py-2 text-center sm:text-left text-[11px] font-semibold uppercase tracking-wide text-ink/45">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const key = toDateInput(d)
              const inMonth = d.getMonth() === month.getMonth()
              const isToday = key === today
              const isSelected = key === selected
              const dayEvents = byDay[key] ?? []
              return (
                <div
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`min-w-0 border-b border-r border-line [&:nth-child(7n)]:border-r-0 min-h-[56px] sm:min-h-[104px] p-1 sm:p-1.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-board/10' : 'hover:bg-line/30'
                  } ${inMonth ? '' : 'bg-line/15'}`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelected(key)
                    }}
                    aria-label={`${formatDate(d)}, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}`}
                    aria-pressed={isSelected}
                    className={`mx-auto sm:mx-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                      isToday ? 'bg-board text-on-board' : isSelected ? 'ring-2 ring-board/40 text-ink' : inMonth ? 'text-ink/80' : 'text-ink/35'
                    }`}
                  >
                    {d.getDate()}
                  </button>

                  {/* Phones: dots only; the selected day's list renders below. */}
                  {dayEvents.length > 0 && (
                    <div className="sm:hidden flex justify-center gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[eventTypeMeta(ev.eventType).tone] ?? TONE_DOT.neutral}`} />
                      ))}
                    </div>
                  )}

                  <div className="hidden sm:flex flex-col gap-0.5 mt-1">
                    {dayEvents.slice(0, MAX_CHIPS).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenEvent(ev)
                        }}
                        title={ev.title}
                        className={`w-full truncate text-left rounded-md px-1.5 py-0.5 text-[11px] font-semibold hover:opacity-80 ${
                          TONE_CHIP[eventTypeMeta(ev.eventType).tone] ?? TONE_CHIP.neutral
                        }`}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > MAX_CHIPS && (
                      <span className="px-1.5 text-[11px] font-semibold text-ink/50">+{dayEvents.length - MAX_CHIPS} more</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-display font-semibold text-ink">{formatDate(parseDayKey(selected))}</h3>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => onCreateOnDay(selected)}>Add event</Button>
        </div>
        {selectedEvents.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-ink/45 py-2">
            <CalendarDays size={16} /> No events on this day.
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {selectedEvents.map((ev) => {
              const type = eventTypeMeta(ev.eventType)
              return (
                <li key={ev.id}>
                  <button type="button" onClick={() => onOpenEvent(ev)} className="w-full text-left flex items-start gap-3 py-3 hover:bg-line/20 rounded-lg px-2 -mx-2">
                    <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${TONE_DOT[type.tone] ?? TONE_DOT.neutral}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-sm text-ink break-words">{ev.title}</span>
                      <span className="block text-xs text-ink/50 mt-0.5">{formatEventRange(ev)}</span>
                      <span className="flex flex-wrap gap-1.5 mt-1.5">
                        <Badge tone={type.tone}>{type.label}</Badge>
                        <Badge tone="info">{AUDIENCE_LABELS[ev.audience] ?? ev.audience}</Badge>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
