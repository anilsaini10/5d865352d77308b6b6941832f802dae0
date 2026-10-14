import { useMemo, useState } from 'react'
import { Card, Field, AsyncContent, inputClass } from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { ATTENDANCE_STATUSES } from '../../constants.js'
import { fetchAll, formatWorked, isNotCheckedOut, statusLabel } from '../teacherAttendance.utils.js'

const CELL = {
  PRESENT: 'bg-success/15 text-success border-success/30',
  LATE: 'bg-warning/15 text-warning border-warning/30',
  ABSENT: 'bg-coral/15 text-coral border-coral/30',
  LEAVE: 'bg-info/15 text-info border-info/30',
  HOLIDAY: 'bg-line/60 text-ink/60 border-line',
}
const pad = (n) => String(n).padStart(2, '0')
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** One teacher's month: calendar coloured by final status, totals, average worked time, days not checked out. */
export default function TeacherMonthView({ teacher }) {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`)
  const [year, mon] = month.split('-').map(Number)
  const daysInMonth = new Date(year, mon, 0).getDate()
  const from = `${month}-01`
  const to = `${month}-${pad(daysInMonth)}`

  const { data, loading, error } = useFetch(() => fetchAll({ from, to, teacherId: teacher.id }), [month, teacher.id], {
    errorMessage: 'Could not load this teacher’s month.',
  })
  const records = data ?? []
  const byDate = useMemo(() => Object.fromEntries(records.map((r) => [r.date, r])), [records])

  const totals = useMemo(() => {
    const t = Object.fromEntries(ATTENDANCE_STATUSES.map((s) => [s.value, 0]))
    records.forEach((r) => { if (r.status) t[r.status] += 1 })
    const worked = records.filter((r) => r.workedMinutes != null)
    return {
      ...t,
      avgWorked: worked.length ? Math.round(worked.reduce((sum, r) => sum + r.workedMinutes, 0) / worked.length) : null,
      notCheckedOut: records.filter(isNotCheckedOut).length,
    }
  }, [records])

  const offset = (new Date(year, mon - 1, 1).getDay() + 6) % 7 // Monday-first

  return (
    <Card className="p-5 mb-5">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{teacher.name}</h3>
          <p className="text-xs text-ink/50">Monthly view · colours show the final status</p>
        </div>
        <div className="w-44"><Field label="Month"><input type="month" className={inputClass} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></Field></div>
      </div>

      <AsyncContent loading={loading && !data} error={error} empty={false}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
          {ATTENDANCE_STATUSES.map((s) => (
            <div key={s.value}><p className="text-xs text-ink/45">{s.label}</p><p className="text-lg font-display font-semibold text-ink">{totals[s.value]}</p></div>
          ))}
          <div><p className="text-xs text-ink/45">Avg worked</p><p className="text-lg font-display font-semibold text-ink">{formatWorked(totals.avgWorked)}</p></div>
          <div><p className="text-xs text-ink/45">Not checked out</p><p className="text-lg font-display font-semibold text-ink">{totals.notCheckedOut}</p></div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 max-w-xl">
          {WEEKDAYS.map((d) => <div key={d} className="text-center text-[11px] font-semibold uppercase text-ink/40">{d}</div>)}
          {Array.from({ length: offset }, (_, i) => <div key={`o${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const r = byDate[`${month}-${pad(day)}`]
            return (
              <div
                key={day}
                title={r?.status ? `${day}: ${statusLabel(r.status)}` : `${day}: no attendance`}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-xs font-semibold ${r?.status ? CELL[r.status] : 'border-line text-ink/30'}`}
              >
                <span>{day}</span>
                {r?.status && <span className="text-[10px] font-medium opacity-80">{statusLabel(r.status).slice(0, 3)}</span>}
              </div>
            )
          })}
        </div>
      </AsyncContent>
    </Card>
  )
}
