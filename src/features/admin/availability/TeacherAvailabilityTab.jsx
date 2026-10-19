import { useState } from 'react'
import { Alert, Button, Card, Field, PageLoader, inputClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { formatPaperDate } from '../exams/components/scheduleUtils.js'
import { availabilityApi } from './availability.api.js'
import { DAY_END, DAY_SHORT, DAY_START, formatMinutes } from './availability.utils.js'
import FreeBusyTimeline, { TimelineLegend } from './components/FreeBusyTimeline.jsx'

/** One teacher: the whole week from the timetable, or a specific date (adds exam duty, leave and absence). */
export default function TeacherAvailabilityTab({ teacherId }) {
  const [date, setDate] = useState('')
  const { data, loading, error } = useFetch(() => availabilityApi.freeSlots({ teacherId, date: date || undefined, from: DAY_START, to: DAY_END }), [teacherId, date], {
    errorMessage: 'Could not load this teacher’s availability.',
  })
  const teacher = data?.teachers?.[0]

  return (
    <div>
      <Card className="p-5 mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44"><Field label="Specific date" hint="Leave empty for the weekly timetable"><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field></div>
          {date && <Button variant="secondary" onClick={() => setDate('')}>Show whole week</Button>}
        </div>
      </Card>

      {loading && !data ? (
        <PageLoader className="py-16" />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : teacher ? (
        <>
          <div className="mb-3"><TimelineLegend /></div>
          <Card className="divide-y divide-line">
            {data.days.map((meta, i) => {
              const d = teacher.days[i]
              return (
                <div key={`${meta.day}-${meta.date ?? ''}`} className="px-5 py-3 grid grid-cols-1 lg:grid-cols-[9rem_minmax(0,1fr)] gap-x-5 gap-y-1">
                  <div>
                    <p className="font-semibold text-ink">{DAY_SHORT[meta.day] ?? meta.day}</p>
                    <p className="text-xs text-ink/45">{meta.date ? formatPaperDate(meta.date) : ''}{d && !meta.schoolClosed && !d.unavailable ? `${meta.date ? ' · ' : ''}${formatMinutes(d.freeMinutes)} free` : ''}</p>
                  </div>
                  {d && <FreeBusyTimeline day={d} meta={meta} />}
                </div>
              )
            })}
          </Card>
        </>
      ) : null}
    </div>
  )
}
