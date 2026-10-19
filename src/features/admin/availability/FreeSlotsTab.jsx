import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { Alert, Card, EmptyState, Field, PageLoader, inputClass, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { todayInput } from '../../../utils/format.js'
import { availabilityApi } from './availability.api.js'
import { DAY_END, DAY_START, formatMinutes, toMinutes } from './availability.utils.js'
import FreeBusyTimeline, { ClosedBanner, TimelineLegend } from './components/FreeBusyTimeline.jsx'
import DayPicker from './components/SlotControls.jsx'

const MIN_GAPS = [{ value: '', label: 'Any gap' }, { value: 15, label: '15+ min' }, { value: 30, label: '30+ min' }, { value: 45, label: '45+ min' }, { value: 60, label: '1h+' }, { value: 90, label: '1h 30m+' }]

/** Everyone's free/busy for one day, sortable by free time. */
export default function FreeSlotsTab() {
  const [mode, setMode] = useState('date')
  const [date, setDate] = useState(todayInput())
  const [day, setDay] = useState('MONDAY')
  const [from, setFrom] = useState(DAY_START)
  const [to, setTo] = useState(DAY_END)
  const [minMinutes, setMinMinutes] = useState('')
  const [sort, setSort] = useState('name')

  const windowError = from && to && toMinutes(to) <= toMinutes(from) ? '"To" must be after "From".' : ''
  const ready = !windowError && (mode === 'date' ? !!date : !!day) && (!!from === !!to)

  const { data, loading, error } = useFetch(
    () => availabilityApi.freeSlots({ ...(mode === 'date' ? { date } : { day }), from: from || undefined, to: to || undefined, minMinutes: minMinutes || undefined }),
    [mode, date, day, from, to, minMinutes],
    { errorMessage: 'Could not load free slots.', enabled: ready }
  )
  const meta = data?.days?.[0]
  const teachers = useMemo(() => {
    const list = (data?.teachers ?? []).map((t) => ({ ...t, d: t.days?.[0] }))
    return sort === 'free' ? list.sort((a, b) => (b.d?.freeMinutes ?? 0) - (a.d?.freeMinutes ?? 0)) : list.sort((a, b) => a.name.localeCompare(b.name))
  }, [data, sort])

  return (
    <div>
      <Card className="p-5 mb-5 space-y-4">
        <DayPicker mode={mode} onMode={setMode} date={date} onDate={setDate} day={day} onDay={setDay} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-36"><Field label="Window from" hint="Default 7 AM"><input type="time" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} /></Field></div>
          <div className="w-36"><Field label="Window to" error={windowError} hint="Default 5 PM"><input type="time" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} /></Field></div>
          <div className="w-40"><Field label="Gaps"><select className={selectClass} value={minMinutes} onChange={(e) => setMinMinutes(e.target.value)}>{MIN_GAPS.map((g) => <option key={g.label} value={g.value}>{g.label}</option>)}</select></Field></div>
          <div className="w-44"><Field label="Sort by"><select className={selectClass} value={sort} onChange={(e) => setSort(e.target.value)}><option value="name">Name</option><option value="free">Most free time</option></select></Field></div>
        </div>
        {(from || to) && !!from !== !!to && <p className="text-xs text-coral font-medium">Set both ends of the window, or leave both empty.</p>}
      </Card>

      {!ready ? (
        <p className="text-sm text-ink/55">{windowError || 'Pick a day to see everyone’s free time.'}</p>
      ) : loading && !data ? (
        <PageLoader className="py-16" />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : data && meta ? (
        <>
          <ClosedBanner schoolClosed={meta.schoolClosed} />
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <TimelineLegend />
            <p className="text-xs text-ink/45">Window {meta.window.from}–{meta.window.to} ({meta.window.source.toLowerCase()})</p>
          </div>
          {teachers.length === 0 ? (
            <EmptyState icon={Users} title="No teachers" message="No active teachers to show." />
          ) : (
            <Card className="divide-y divide-line">
              {teachers.map((t) => (
                <div key={t.teacherId} className="px-5 py-3 grid grid-cols-1 lg:grid-cols-[12rem_minmax(0,1fr)] gap-x-5 gap-y-1">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">{t.name}</p>
                    <p className="text-xs text-ink/45">{t.employeeId}{t.d && !meta.schoolClosed && !t.d.unavailable ? ` · ${formatMinutes(t.d.freeMinutes)} free` : ''}</p>
                  </div>
                  {t.d ? <FreeBusyTimeline day={t.d} meta={meta} /> : null}
                </div>
              ))}
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
