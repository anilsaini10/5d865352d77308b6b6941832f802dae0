import { toDateInput } from '../../../utils/format.js'
import { addDays, parseDayKey } from '../events/components/eventUtils.js'

/** Highest priority first: closed types, then exam, then the rest. */
export const TYPE_PRIORITY = ['GOVERNMENT_HOLIDAY', 'VACATION', 'HOLIDAY', 'EXAM', 'MEETING', 'ACTIVITY', 'OTHER']

// Literal class names so Tailwind generates them. cell = tinted day, bar = range bar, dot = legend swatch.
export const TYPE_STYLE = {
  // School-closed types are the only reds — three strengths so they stay tellable apart.
  GOVERNMENT_HOLIDAY: { cell: 'bg-coral text-white', bar: 'bg-coral text-white', dot: 'bg-coral' },
  VACATION: { cell: 'bg-coral/60 text-white', bar: 'bg-coral/60 text-white', dot: 'bg-coral/60' },
  HOLIDAY: { cell: 'bg-coral/25 text-coral', bar: 'bg-coral/25 text-coral', dot: 'bg-coral/30' },
  // Everything else gets its own non-red colour.
  EXAM: { cell: 'bg-board text-on-board', bar: 'bg-board text-on-board', dot: 'bg-board' },
  MEETING: { cell: 'bg-chalk/70 text-chalk-ink', bar: 'bg-chalk/70 text-chalk-ink', dot: 'bg-chalk' },
  ACTIVITY: { cell: 'bg-success/30 text-success', bar: 'bg-success/30 text-success', dot: 'bg-success' },
  OTHER: { cell: 'bg-line text-ink/70', bar: 'bg-line text-ink/70', dot: 'bg-ink/40' },
}
export const styleOf = (type) => TYPE_STYLE[type] ?? TYPE_STYLE.OTHER

const prio = (type) => {
  const i = TYPE_PRIORITY.indexOf(type)
  return i === -1 ? TYPE_PRIORITY.length : i
}

/** "YYYY-MM-DD" keys from start to end inclusive (local calendar days). */
export function eachDay(startKey, endKey) {
  const out = []
  for (let d = parseDayKey(startKey); toDateInput(d) <= endKey; d = addDays(d, 1)) out.push(toDateInput(d))
  return out
}

/** Map of date key → entries covering that day, highest priority first. */
export function buildDayMap(entries) {
  const map = new Map()
  entries.forEach((e) => {
    eachDay(e.startDate, e.endDate).forEach((key) => {
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(e)
    })
  })
  map.forEach((list) => list.sort((a, b) => prio(a.type) - prio(b.type)))
  return map
}

export const isSunday = (key) => parseDayKey(key).getDay() === 0

/** Monday-first weeks (arrays of 7 { key, inMonth }) for a "YYYY-MM" month. */
export function monthWeeks(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const last = new Date(y, m, 0)
  const start = addDays(first, -((first.getDay() + 6) % 7))
  const end = addDays(last, 6 - ((last.getDay() + 6) % 7))
  const weeks = []
  for (let d = start; d <= end; d = addDays(d, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => {
      const day = addDays(d, i)
      return { key: toDateInput(day), inMonth: day.getMonth() === m - 1 }
    }))
  }
  return weeks
}

/**
 * Lays one week's entries out as bars: each bar has a 1-based grid column span and a lane (row).
 * `startsHere` / `endsHere` say whether the entry begins/ends inside this week (for rounded ends).
 */
export function weekBars(week, entries) {
  const first = week[0].key
  const last = week[6].key
  const bars = entries
    .filter((e) => e.startDate <= last && e.endDate >= first)
    .sort((a, b) => prio(a.type) - prio(b.type) || a.startDate.localeCompare(b.startDate))
    .map((e) => {
      const from = e.startDate < first ? first : e.startDate
      const to = e.endDate > last ? last : e.endDate
      return {
        entry: e,
        col: week.findIndex((d) => d.key === from) + 1,
        end: week.findIndex((d) => d.key === to) + 2,
        startsHere: e.startDate >= first,
        endsHere: e.endDate <= last,
      }
    })
  const lanes = []
  bars.forEach((bar) => {
    let lane = lanes.findIndex((l) => l.every((b) => bar.col >= b.end || bar.end <= b.col))
    if (lane === -1) lane = lanes.push([]) - 1
    lanes[lane].push(bar)
    bar.lane = lane
  })
  return { bars, laneCount: lanes.length }
}

export const sessionLabel = (y) => `${y}-${String((y + 1) % 100).padStart(2, '0')}`
