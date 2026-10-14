import { useEffect, useMemo, useState } from 'react'
import { Modal, Alert, Badge, Button, SearchInput, AsyncContent } from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { useToast } from '../../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { ATTENDANCE_STATUSES } from '../../constants.js'
import { teacherAttendanceApi } from '../teacherAttendance.api.js'
import { fetchAllForDate, formatClock, formatDay, statusLabel } from '../teacherAttendance.utils.js'
import StatusSegment from './StatusSegment.jsx'

/** Bulk admin marking for one date. Only rows the admin set or changed are sent. */
export default function BulkMarkModal({ open, onClose, date, teachers, onSaved }) {
  const { notify } = useToast()
  const [statuses, setStatuses] = useState({})
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const { data: existing, loading, error } = useFetch(() => fetchAllForDate(date), [date, open], {
    errorMessage: 'Could not load existing attendance for this date.',
    enabled: open,
  })
  const recordByTeacher = useMemo(() => Object.fromEntries((existing ?? []).map((r) => [r.teacherId, r])), [existing])

  useEffect(() => {
    if (!open || !existing) return
    // Admin's mark wins, then the teacher's check-in; otherwise empty.
    const prefill = {}
    for (const r of existing) {
      const initial = r.adminStatus ?? r.teacherStatus
      if (initial) prefill[r.teacherId] = initial
    }
    setStatuses(prefill)
    setServerError('')
  }, [open, existing])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return teachers
    return teachers.filter((t) => [t.name, t.employeeId, t.email].filter(Boolean).some((v) => v.toLowerCase().includes(q)))
  }, [teachers, search])

  const counts = useMemo(() => {
    const c = Object.fromEntries(ATTENDANCE_STATUSES.map((s) => [s.value, 0]))
    let marked = 0
    for (const t of teachers) {
      const s = statuses[t.id]
      if (s) { c[s] += 1; marked += 1 }
    }
    return { ...c, marked, unmarked: teachers.length - marked }
  }, [teachers, statuses])

  const changed = teachers.filter((t) => statuses[t.id] && statuses[t.id] !== recordByTeacher[t.id]?.adminStatus)

  const markUnmarkedAbsent = () =>
    setStatuses((prev) => ({ ...prev, ...Object.fromEntries(teachers.filter((t) => !prev[t.id]).map((t) => [t.id, 'ABSENT'])) }))
  // Only teachers the admin hasn't already marked — never overrides an admin decision.
  const markCheckedInPresent = () =>
    setStatuses((prev) => ({
      ...prev,
      ...Object.fromEntries(teachers.filter((t) => recordByTeacher[t.id]?.teacherStatus && !recordByTeacher[t.id]?.adminStatus).map((t) => [t.id, 'PRESENT'])),
    }))

  const submit = async () => {
    setServerError('')
    if (!changed.length) {
      setServerError('Set or change a status for at least one teacher.')
      return
    }
    setSubmitting(true)
    try {
      await teacherAttendanceApi.markBulk({ date, records: changed.map((t) => ({ teacherId: t.id, status: statuses[t.id] })) })
      notify(`Attendance saved for ${changed.length} teacher${changed.length === 1 ? '' : 's'} on ${formatDay(date)}.`, 'success')
      onSaved()
      onClose()
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not save attendance.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} wide="xl" title="Mark attendance" subtitle={formatDay(date)}>
      <div className="space-y-4">
        <p className="text-xs text-ink/55">
          Your marking becomes the final status. Teachers’ own check-in/out times are kept. Teachers marked Leave or Holiday can’t check in from the app that day.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Find a teacher..." />
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="secondary" onClick={markCheckedInPresent} disabled={loading}>Mark all checked-in as Present</Button>
            <Button size="sm" variant="secondary" onClick={markUnmarkedAbsent} disabled={loading}>Mark all unmarked as Absent</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {ATTENDANCE_STATUSES.map((s) => <Badge key={s.value} tone={s.tone}>{s.label}: {counts[s.value]}</Badge>)}
          <Badge tone="neutral">Not marked: {counts.unmarked}</Badge>
        </div>

        <div className="rounded-xl border border-line overflow-hidden">
          <AsyncContent loading={loading && !existing} error={error} empty={visible.length === 0} emptyState={<p className="p-6 text-sm text-ink/50">No matching teachers.</p>}>
            <ul className="divide-y divide-line">
              {visible.map((t) => {
                const rec = recordByTeacher[t.id]
                const checkIn = rec?.teacherStatus ? `Checked in${rec.teacherMarkedAt ? ` ${formatClock(rec.teacherMarkedAt)}` : ''}${rec.teacherStatus !== 'PRESENT' ? ` (${statusLabel(rec.teacherStatus)})` : ''}` : ''
                return (
                  <li key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{t.name}</p>
                      <p className="text-xs text-ink/45 truncate">{t.employeeId}</p>
                      <p className={`text-xs mt-0.5 ${checkIn ? 'text-board font-medium' : 'text-ink/35'}`}>{checkIn || 'Not checked in'}</p>
                    </div>
                    <StatusSegment name={t.name} value={statuses[t.id]} onChange={(s) => setStatuses((p) => ({ ...p, [t.id]: s }))} />
                  </li>
                )
              })}
            </ul>
          </AsyncContent>
        </div>

        <Alert>{serverError}</Alert>

        <div className="flex items-center justify-end gap-3">
          <p className="text-sm text-ink/55">{changed.length} to save</p>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={submitting} disabled={!changed.length}>Save attendance</Button>
        </div>
      </div>
    </Modal>
  )
}
