import { CalendarDays, Coffee } from 'lucide-react'
import { AsyncContent, Card, EmptyState } from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { formatTime } from '../../../../utils/format.js'
import { DAYS, DAY_LABELS, SCHEDULE_TYPES } from '../../constants.js'
import { scheduleApi } from '../../schedule/schedule.api.js'

export default function TeacherTimetableTab({ teacherId }) {
  const { data, loading, error } = useFetch(() => scheduleApi.forTeacher(teacherId), [teacherId], {
    errorMessage: 'Could not load the timetable.',
  })

  const timetable = data?.timetable ?? {}
  const days = DAYS.filter((d) => timetable[d]?.length)

  return (
    <AsyncContent
      loading={loading}
      error={error}
      empty={days.length === 0}
      emptyState={
        <Card>
          <EmptyState icon={CalendarDays} title="No periods scheduled" message="This teacher has no periods in the timetable yet." />
        </Card>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {days.map((day) => {
          const entries = [...timetable[day]].sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))
          return (
            <Card key={day} className="p-4">
              <h3 className="font-display font-semibold text-ink mb-3">{DAY_LABELS[day]}</h3>
              <ul className="space-y-2">
                {entries.map((e, i) => {
                  const isBreak = e.type === SCHEDULE_TYPES.BREAK
                  return (
                    <li
                      key={e.id ?? `${day}-${i}`}
                      className={`rounded-xl border px-3 py-2.5 ${isBreak ? 'border-dashed border-line bg-line/20' : 'border-line bg-paper'}`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-ink/50">
                        <span className="font-semibold">{isBreak ? 'Break' : e.periodNo != null ? `Period ${e.periodNo}` : 'Period'}</span>
                        <span className="whitespace-nowrap">{formatTime(e.startTime)} – {formatTime(e.endTime)}</span>
                      </div>
                      {isBreak ? (
                        <p className="text-sm text-ink/70 mt-1 flex items-center gap-1.5">
                          <Coffee size={14} /> {e.title || 'Break'}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-ink mt-1">{e.subjectName ?? '—'}</p>
                          <p className="text-xs text-ink/55">
                            {[e.className && `${e.className}${e.sectionName ? ` – ${e.sectionName}` : ''}`, e.roomNo && `Room ${e.roomNo}`]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Card>
          )
        })}
      </div>
    </AsyncContent>
  )
}
