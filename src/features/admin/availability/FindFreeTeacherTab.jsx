import { useState } from 'react'
import { BookOpen, CalendarOff, ClipboardList, Copy, Phone, UserX, Users } from 'lucide-react'
import { Alert, Badge, Card, EmptyState, Field, PageLoader, SearchInput, inputClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { formatTime, todayInput } from '../../../utils/format.js'
import { availabilityApi } from './availability.api.js'
import { busyLabel, busyMeta, toMinutes } from './availability.utils.js'
import { ClosedBanner } from './components/FreeBusyTimeline.jsx'
import DayPicker from './components/SlotControls.jsx'

const BUSY_ICON = { CLASS: BookOpen, INVIGILATION: ClipboardList, LEAVE: CalendarOff, ABSENT: UserX }

function TeacherCard({ t }) {
  const { notify } = useToast()
  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(t.phone)
      notify('Phone number copied.', 'success')
    } catch {
      notify(t.phone, 'info')
    }
  }
  return (
    <div className={`rounded-2xl border p-4 ${t.free ? 'bg-success/8 border-success/30' : 'bg-line/25 border-line opacity-90'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate">{t.name}</p>
          <p className="text-xs text-ink/50">{t.employeeId}</p>
        </div>
        <Badge tone={t.free ? 'success' : 'neutral'}>{t.free ? 'Free' : 'Busy'}</Badge>
      </div>
      {t.subjects?.length > 0 && <p className="text-xs text-ink/60 mt-2">{t.subjects.join(', ')}</p>}
      {t.phone && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          <a href={`tel:${t.phone}`} className="inline-flex items-center gap-1 font-semibold text-board hover:underline"><Phone size={12} /> {t.phone}</a>
          <button type="button" onClick={copyPhone} className="inline-flex items-center gap-1 text-ink/50 hover:text-ink" aria-label={`Copy ${t.name}'s number`}><Copy size={12} /> Copy</button>
        </div>
      )}
      {!t.free && (
        <ul className="mt-3 space-y-1.5">
          {t.busy.map((b, i) => {
            const Icon = BUSY_ICON[b.type] ?? BookOpen
            const m = busyMeta(b.type)
            return (
              <li key={i} className="flex items-start gap-2 text-xs text-ink/70">
                <Icon size={14} className={`shrink-0 mt-0.5 ${m.chip}`} />
                <span>
                  <span className="font-semibold text-ink">{busyLabel(b)}</span>
                  {b.startTime && <span className="text-ink/50"> · {formatTime(b.startTime)}–{formatTime(b.endTime)}</span>}
                  {b.roomNo && <span className="text-ink/50"> · Room {b.roomNo}</span>}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** "Find a free teacher" for a date (or every week on a weekday) and a time slot. `initial` pre-fills from a timetable period or exam paper. */
export default function FindFreeTeacherTab({ initial = {} }) {
  const [mode, setMode] = useState(initial.day && !initial.date ? 'day' : 'date')
  const [date, setDate] = useState(initial.date || todayInput())
  const [day, setDay] = useState(initial.day || 'MONDAY')
  const [startTime, setStartTime] = useState(initial.start || '10:00')
  const [endTime, setEndTime] = useState(initial.end || '11:00')
  const [onlyFree, setOnlyFree] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())

  const timeError = startTime && endTime && toMinutes(endTime) <= toMinutes(startTime) ? 'End time must be after the start time.' : ''
  const ready = !!startTime && !!endTime && !timeError && (mode === 'date' ? !!date : !!day)

  const { data, loading, error } = useFetch(
    () => availabilityApi.find({ ...(mode === 'date' ? { date } : { day }), startTime, endTime, onlyFree, search: debouncedSearch }),
    [mode, date, day, startTime, endTime, onlyFree, debouncedSearch],
    { errorMessage: 'Could not check availability.', enabled: ready }
  )
  const items = data?.items ?? []

  return (
    <div>
      <Card className="p-5 mb-5 space-y-4">
        <DayPicker mode={mode} onMode={setMode} date={date} onDate={setDate} day={day} onDay={setDay} />
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-36"><Field label="Start time" error={undefined}><input type="time" className={inputClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} /></Field></div>
          <div className="w-36"><Field label="End time" error={timeError}><input type="time" className={inputClass} value={endTime} onChange={(e) => setEndTime(e.target.value)} /></Field></div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search teacher by name…" className="max-w-xs" />
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink/70 pb-2.5">
            <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} /> Only free
          </label>
        </div>
      </Card>

      {!ready ? (
        <p className="text-sm text-ink/55">{timeError || 'Pick a date and a time slot to see who is free.'}</p>
      ) : loading && !data ? (
        <PageLoader className="py-16" />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : data ? (
        <>
          <ClosedBanner schoolClosed={data.schoolClosed} />
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge tone="success">Free {data.summary.free}</Badge>
            <Badge tone="neutral">Busy {data.summary.busy}</Badge>
            <span className="text-xs text-ink/45 self-center">{data.summary.total} active teachers · back-to-back periods count as free</span>
          </div>
          {items.length === 0 ? (
            <EmptyState icon={Users} title="No teachers found" message={onlyFree ? 'Nobody is free in this slot.' : 'Try a different search.'} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{items.map((t) => <TeacherCard key={t.teacherId} t={t} />)}</div>
          )}
        </>
      ) : null}
    </div>
  )
}
