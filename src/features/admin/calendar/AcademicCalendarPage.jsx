import { useMemo, useState } from 'react'
import { CalendarRange, FileSpreadsheet, Plus } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, Button, ConfirmDialog, Field, PageLoader, Tabs, inputClass, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { formatNumber, todayInput } from '../../../utils/format.js'
import { EVENT_TYPES } from '../constants.js'
import EventFormModal from '../events/components/EventFormModal.jsx'
import { eventsApi } from '../events/events.api.js'
import { calendarApi } from './calendar.api.js'
import { buildDayMap, sessionLabel, styleOf } from './calendar.utils.js'
import CalendarLegend from './components/CalendarLegend.jsx'
import DayPanel from './components/DayPanel.jsx'
import ImportEventsModal from './components/ImportEventsModal.jsx'
import ListView from './components/ListView.jsx'
import MonthView from './components/MonthView.jsx'
import YearView from './components/YearView.jsx'

const VIEWS = [
  { value: 'year', label: 'Year' },
  { value: 'month', label: 'Month' },
  { value: 'list', label: 'List' },
]
const MAX_RANGE_DAYS = 400

const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000) + 1

function SummaryTile({ label, value, tone }) {
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 flex items-center gap-1.5">
        {tone && <span className={`w-2 h-2 rounded-sm ${tone}`} aria-hidden="true" />}{label}
      </p>
      <p className="text-2xl font-semibold text-ink mt-0.5">{formatNumber(value)}</p>
    </div>
  )
}

export default function AcademicCalendarPage() {
  const { notify } = useToast()
  const [session, setSession] = useState('') // '' = current session, 'YYYY' = that session, 'custom'
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [view, setView] = useState('year')
  const [eventType, setEventType] = useState('')
  const [monthIndex, setMonthIndex] = useState(null)
  const [selected, setSelected] = useState('')
  const [form, setForm] = useState({ open: false, event: null, date: '' })
  const [importOpen, setImportOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const custom = session === 'custom'
  const rangeError =
    custom && customFrom && customTo
      ? customTo < customFrom ? '"To" must be on or after "From".' : daysBetween(customFrom, customTo) > MAX_RANGE_DAYS ? `A custom range can be at most ${MAX_RANGE_DAYS} days.` : ''
      : ''
  const ready = !custom || (!!customFrom && !!customTo && !rangeError)

  const { data, loading, error, reload } = useFetch(
    () => calendarApi.get(custom ? { from: customFrom, to: customTo, eventType } : { year: session || undefined, eventType }),
    [session, customFrom, customTo, eventType],
    { errorMessage: 'Could not load the academic calendar.', enabled: ready }
  )

  const months = data?.months ?? []
  const dayMap = useMemo(() => buildDayMap(data?.entries ?? []), [data])
  const summary = data?.summary

  // Month view opens on the current month when it's in range, otherwise the first month.
  const effectiveIndex = useMemo(() => {
    if (monthIndex != null && monthIndex < months.length) return monthIndex
    const i = months.findIndex((m) => todayInput().startsWith(m.month))
    return i === -1 ? 0 : i
  }, [monthIndex, months])

  const baseYear = data?.range?.session?.year ?? new Date().getFullYear()
  const sessionOptions = [baseYear - 1, baseYear, baseYear + 1]

  const pickDay = (key) => {
    setSelected(key)
    // In month view, jump to that day's month when a bar/day belongs to another month.
    const i = months.findIndex((m) => key.startsWith(m.month))
    if (view === 'month' && i !== -1) setMonthIndex(i)
  }

  const openAdd = (date = '') => setForm({ open: true, event: null, date })
  const openEdit = (entry) => setForm({ open: true, event: { ...entry, eventType: entry.type }, date: '' })

  const confirmDelete = async () => {
    try {
      await eventsApi.remove(deleting.id)
      notify('Entry deleted.', 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete the entry.'), 'error')
      reload()
    }
  }

  return (
    <AppShell
      title="Academic Calendar"
      subtitle={data?.range ? `${data.range.session ? `Session ${data.range.session.label}` : 'Custom range'} · working days exclude Sundays and school-closed days` : 'Plan holidays, vacations, exams and events'}
      actions={
        <>
          <Button variant="secondary" icon={FileSpreadsheet} onClick={() => setImportOpen(true)}><span className="hidden sm:inline">Import from Excel</span></Button>
          <Button icon={Plus} onClick={() => openAdd()}><span className="hidden sm:inline">Add entry</span></Button>
        </>
      }
    >
      <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-4">
        <div className="lg:w-56">
          <Field label="Session">
            <select className={selectClass} value={session} onChange={(e) => { setSession(e.target.value); setMonthIndex(null); setSelected('') }}>
              <option value="">Current session</option>
              {sessionOptions.map((y) => <option key={y} value={String(y)}>{sessionLabel(y)}</option>)}
              <option value="custom">Custom range…</option>
            </select>
          </Field>
        </div>
        {custom && (
          <>
            <Field label="From"><input type="date" className={inputClass} value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} /></Field>
            <Field label="To"><input type="date" className={inputClass} value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} /></Field>
          </>
        )}
        <div className="overflow-x-auto"><Tabs options={VIEWS} value={view} onChange={setView} /></div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button type="button" onClick={() => setEventType('')} aria-pressed={!eventType} className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${!eventType ? 'bg-board text-on-board border-board' : 'bg-surface border-line text-ink/65 hover:bg-line/40'}`}>All</button>
        {EVENT_TYPES.map((t) => (
          <button key={t.value} type="button" onClick={() => setEventType(eventType === t.value ? '' : t.value)} aria-pressed={eventType === t.value}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${eventType === t.value ? 'bg-board text-on-board border-board' : 'bg-surface border-line text-ink/65 hover:bg-line/40'}`}>
            <span className={`w-2 h-2 rounded-sm ${styleOf(t.value).dot}`} aria-hidden="true" />{t.label}
          </button>
        ))}
      </div>

      {rangeError && <Alert className="mb-4">{rangeError}</Alert>}
      {custom && !ready && !rangeError && <p className="text-sm text-ink/55 mb-4">Pick both dates to load the calendar.</p>}

      {ready && loading && !data ? (
        <PageLoader className="py-24" />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : data ? (
        <>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
              <SummaryTile label="Working days" value={summary.workingDays} tone="bg-success" />
              <SummaryTile label="School closed" value={summary.schoolClosedDays} tone="bg-coral/60" />
              <SummaryTile label="Holidays" value={summary.holidayDays} tone={styleOf('HOLIDAY').dot} />
              <SummaryTile label="Govt holidays" value={summary.governmentHolidayDays} tone={styleOf('GOVERNMENT_HOLIDAY').dot} />
              <SummaryTile label="Vacation days" value={summary.vacationDays} tone={styleOf('VACATION').dot} />
              <SummaryTile label="Exam days" value={summary.examDays} tone={styleOf('EXAM').dot} />
            </div>
          )}

          <div className="mb-4"><CalendarLegend /></div>

          {view === 'year' && <YearView months={months} dayMap={dayMap} range={data.range} selected={selected} onSelect={pickDay} />}
          {view === 'month' && <MonthView months={months} index={effectiveIndex} onIndex={setMonthIndex} dayMap={dayMap} selected={selected} onSelect={pickDay} />}
          {view === 'list' && <ListView months={months} onEdit={openEdit} onDelete={setDeleting} />}

          {view !== 'list' && <DayPanel day={selected} entries={dayMap.get(selected)} onAdd={openAdd} onEdit={openEdit} onDelete={setDeleting} />}
          {view !== 'list' && !selected && (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink/50"><CalendarRange size={15} /> Select a date to see or add its entries.</p>
          )}
        </>
      ) : null}

      <EventFormModal
        open={form.open}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
        event={form.event}
        defaultDate={form.date}
        onSaved={(_, { isEdit }) => {
          notify(isEdit ? 'Entry updated.' : 'Entry added.', 'success')
          reload()
        }}
      />

      <ImportEventsModal open={importOpen} onClose={() => setImportOpen(false)} onImported={reload} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this entry?"
        confirmLabel="Delete entry"
        message={deleting && <><span className="font-semibold text-ink">{deleting.title}</span> will be removed from the calendar.</>}
      />
    </AppShell>
  )
}
