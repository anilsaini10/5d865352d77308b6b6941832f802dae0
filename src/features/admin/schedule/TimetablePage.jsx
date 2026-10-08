import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarClock, Plus } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, Button, Card, ConfirmDialog, EmptyState, Field, PageLoader, Tabs, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { formatTime } from '../../../utils/format.js'
import { DAYS, DAY_LABELS, SCHEDULE_TYPES } from '../constants.js'
import { useClasses } from '../classes/useClasses.js'
import { subjectsApi } from '../subjects/subjects.api.js'
import { teachersApi } from '../teachers/teachers.api.js'
import { scheduleApi } from './schedule.api.js'
import ScheduleEntryCard from './components/ScheduleEntryCard.jsx'
import ScheduleEntryModal from './components/ScheduleEntryModal.jsx'

const WEEKDAYS = DAYS.filter((d) => d !== 'SUNDAY')
const EMPTY = []

const byStartTime = (a, b) => String(a.startTime).localeCompare(String(b.startTime))

function todayKey() {
  return DAYS[(new Date().getDay() + 6) % 7]
}

function DayColumn({ day, entries, onAdd, onEdit, onDelete }) {
  return (
    <div className="min-w-0 flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <p className="font-display font-semibold text-ink truncate">{DAY_LABELS[day]}</p>
        <span className="text-xs text-ink/40 shrink-0">{entries.length}</span>
      </div>
      <div className="space-y-2 flex-1">
        {entries.length === 0 && (
          <p className="text-xs text-ink/40 border border-dashed border-line rounded-xl px-3 py-4 text-center">Nothing scheduled</p>
        )}
        {entries.map((e) => (
          <ScheduleEntryCard key={e.id} entry={e} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
      <Button variant="ghost" size="sm" icon={Plus} className="mt-2 w-full border border-dashed border-line" onClick={() => onAdd(day)}>
        Add period
      </Button>
    </div>
  )
}

export default function TimetablePage() {
  const { notify } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const classId = searchParams.get('classId') || ''
  const sectionId = searchParams.get('sectionId') || ''

  const { classes, sectionsOf, loading: classesLoading, error: classesError } = useClasses()
  const { data: teachersData, error: teachersError } = useFetch(() => teachersApi.listAll(), [], {
    errorMessage: 'Could not load teachers.',
  })
  const { data: subjectsData } = useFetch(() => subjectsApi.list(), [], { errorMessage: 'Could not load subjects.' })

  const { data: timetableData, loading, error, reload } = useFetch(() => scheduleApi.forSection(sectionId), [sectionId], {
    errorMessage: 'Could not load the timetable.',
    enabled: !!sectionId,
  })

  const [showSunday, setShowSunday] = useState(false)
  const [mobileDay, setMobileDay] = useState(() => todayKey())
  const [modal, setModal] = useState({ open: false, entry: null, day: 'MONDAY' })
  const [deleting, setDeleting] = useState(null)

  const selectedClass = classes.find((c) => c.id === classId)
  const sections = sectionsOf(classId)
  const selectedSection = sections.find((s) => s.id === sectionId)
  const classSubjects = selectedClass?.subjects ?? EMPTY
  const teachers = teachersData ?? EMPTY
  const allSubjects = subjectsData ?? EMPTY

  // Single-section classes don't need a second click.
  useEffect(() => {
    if (classId && !sectionId && sections.length === 1) {
      setSearchParams({ classId, sectionId: sections[0].id }, { replace: true })
    }
  }, [classId, sectionId, sections, setSearchParams])

  const timetable = useMemo(() => {
    const raw = sectionId ? timetableData?.timetable ?? {} : {}
    return Object.fromEntries(DAYS.map((d) => [d, [...(raw[d] ?? [])].sort(byStartTime)]))
  }, [timetableData, sectionId])

  const sundayHasEntries = timetable.SUNDAY.length > 0
  const visibleDays = showSunday || sundayHasEntries ? DAYS : WEEKDAYS
  const activeMobileDay = visibleDays.includes(mobileDay) ? mobileDay : visibleDays[0]
  const totalEntries = DAYS.reduce((n, d) => n + timetable[d].length, 0)

  const sectionInfo = {
    classId,
    sectionId,
    className: selectedClass?.name || timetableData?.className,
    sectionName: selectedSection?.name || timetableData?.sectionName,
  }

  const pickClass = (value) => setSearchParams(value ? { classId: value } : {})
  const pickSection = (value) => setSearchParams(value ? { classId, sectionId: value } : { classId })

  const openAdd = (day) => setModal({ open: true, entry: null, day: day || activeMobileDay })
  const openEdit = (entry) => setModal({ open: true, entry, day: entry.day })
  const closeModal = () => setModal((m) => ({ ...m, open: false }))

  const onSaved = ({ isEdit }) => {
    notify(isEdit ? 'Timetable entry updated.' : 'Added to the timetable.', 'success')
    // Changing a day/time can renumber other periods, so always refetch the section.
    reload()
  }

  const confirmDelete = async () => {
    try {
      await scheduleApi.remove(deleting.id)
      notify('Timetable entry deleted.', 'success')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete the entry.'), 'error')
    } finally {
      reload()
    }
  }

  const ready = !!sectionId && !!selectedSection

  return (
    <AppShell
      title="Timetable"
      subtitle={ready ? `${sectionInfo.className} – Section ${sectionInfo.sectionName}` : 'Build the weekly schedule for each section'}
      actions={
        ready && (
          <Button icon={Plus} onClick={() => openAdd()}>
            <span className="hidden sm:inline">Add period</span>
          </Button>
        )
      }
    >
      <Card className="p-4 sm:p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 items-end">
          <Field label="Class">
            <select className={selectClass} value={classId} onChange={(e) => pickClass(e.target.value)} disabled={classesLoading}>
              <option value="">{classesLoading ? 'Loading classes…' : 'Select a class'}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Section">
            <select className={selectClass} value={sectionId} onChange={(e) => pickSection(e.target.value)} disabled={!selectedClass}>
              <option value="">Select a section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          {ready && (
            <label className="flex items-center gap-2 text-sm text-ink/70 cursor-pointer pb-2.5">
              <input
                type="checkbox"
                className="accent-board"
                checked={showSunday || sundayHasEntries}
                disabled={sundayHasEntries}
                onChange={(e) => setShowSunday(e.target.checked)}
              />
              Show Sunday
            </label>
          )}
        </div>
        {classesError && <Alert className="mt-4">{classesError}</Alert>}
        {teachersError && <Alert tone="warning" className="mt-4">{teachersError} The teacher picker may be empty.</Alert>}
        {!classesLoading && classId && !selectedClass && (
          <Alert tone="warning" className="mt-4">That class no longer exists. Pick another class.</Alert>
        )}
        {selectedClass && sectionId && !selectedSection && (
          <Alert tone="warning" className="mt-4">That section no longer exists. Pick another section.</Alert>
        )}
      </Card>

      {!ready ? (
        classesLoading ? (
          <PageLoader />
        ) : (
          <Card>
            <EmptyState
              icon={CalendarClock}
              title="Pick a class and section"
              message="Choose a class and section above to view and build its weekly timetable."
            />
          </Card>
        )
      ) : loading && !timetableData ? (
        <PageLoader />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : (
        <>
          {totalEntries === 0 && (
            <Alert tone="info" className="mb-4">
              No periods yet for this section. Use “Add period” on any day to start building the timetable.
            </Alert>
          )}

          {/* Desktop: full week view */}
          <div className={`hidden xl:grid gap-3 ${visibleDays.length === 7 ? 'xl:grid-cols-7' : 'xl:grid-cols-6'} ${loading ? 'opacity-60' : ''}`}>
            {visibleDays.map((day) => (
              <DayColumn key={day} day={day} entries={timetable[day]} onAdd={openAdd} onEdit={openEdit} onDelete={setDeleting} />
            ))}
          </div>

          {/* Mobile / tablet: one day at a time */}
          <div className={`xl:hidden ${loading ? 'opacity-60' : ''}`}>
            <div className="overflow-x-auto -mx-1 px-1 pb-1 mb-4">
              <Tabs
                options={visibleDays.map((d) => ({ value: d, label: DAY_LABELS[d].slice(0, 3), count: timetable[d].length || undefined }))}
                value={activeMobileDay}
                onChange={setMobileDay}
              />
            </div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-display text-lg font-semibold text-ink">{DAY_LABELS[activeMobileDay]}</h2>
              <Button variant="secondary" size="sm" icon={Plus} onClick={() => openAdd(activeMobileDay)}>
                Add period
              </Button>
            </div>
            {timetable[activeMobileDay].length === 0 ? (
              <Card>
                <EmptyState
                  icon={CalendarClock}
                  title="Nothing scheduled"
                  message={`No periods or breaks on ${DAY_LABELS[activeMobileDay]} yet.`}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {timetable[activeMobileDay].map((e) => (
                  <ScheduleEntryCard key={e.id} entry={e} onEdit={openEdit} onDelete={setDeleting} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {ready && (
        <ScheduleEntryModal
          open={modal.open}
          onClose={closeModal}
          entry={modal.entry}
          defaultDay={modal.day}
          section={sectionInfo}
          classSubjects={classSubjects}
          allSubjects={allSubjects}
          teachers={teachers}
          onSaved={onSaved}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={deleting?.type === SCHEDULE_TYPES.BREAK ? 'Delete break?' : 'Delete period?'}
        message={
          deleting && (
            <>
              <span className="font-semibold text-ink">
                {deleting.type === SCHEDULE_TYPES.BREAK ? deleting.title || 'Break' : deleting.subjectName}
              </span>{' '}
              on {DAY_LABELS[deleting.day]}, {formatTime(deleting.startTime?.slice(0, 5))} – {formatTime(deleting.endTime?.slice(0, 5))}, will be
              removed from this section's timetable. Remaining periods that day will be renumbered.
            </>
          )
        }
      />
    </AppShell>
  )
}
