import { useEffect, useMemo, useState } from 'react'
import { CheckCheck, UserSquare2 } from 'lucide-react'
import {
  Alert, AsyncContent, Badge, Button, Card, EmptyState, Field, SearchInput, inputClass,
} from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { useToast } from '../../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { formatDate, todayInput } from '../../../../utils/format.js'
import { ATTENDANCE_STATUSES } from '../../constants.js'
import { teacherAttendanceApi } from '../teacherAttendance.api.js'
import { validateMarkDate } from '../teacherAttendance.validation.js'
import StatusSegment from './StatusSegment.jsx'

const PAGE_SIZE = 100

async function fetchAllForDate(date) {
  const first = await teacherAttendanceApi.list({ date, page: 1, pageSize: PAGE_SIZE })
  if (first.totalPages <= 1) return first.items
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) => teacherAttendanceApi.list({ date, page: i + 2, pageSize: PAGE_SIZE }))
  )
  return [...first.items, ...rest.flatMap((r) => r.items)]
}

export default function MarkAttendanceTab({ teachers, teachersLoading, teachersError }) {
  const { notify } = useToast()
  const [date, setDate] = useState(todayInput())
  const [statuses, setStatuses] = useState({})
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const dateError = validateMarkDate(date)

  const { data: existing, loading: existingLoading, error: existingError, reload } = useFetch(
    () => fetchAllForDate(date),
    [date],
    { errorMessage: 'Could not load existing attendance for this date.', enabled: !dateError }
  )

  useEffect(() => {
    setStatuses({})
  }, [date])

  useEffect(() => {
    const prefill = {}
    for (const r of existing ?? []) if (r.teacherId) prefill[r.teacherId] = r.status
    setStatuses(prefill)
    setServerError('')
  }, [existing])

  const existingCount = existing?.length ?? 0

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
      if (s) {
        c[s] += 1
        marked += 1
      }
    }
    return { ...c, unmarked: teachers.length - marked, marked }
  }, [teachers, statuses])

  const setOne = (teacherId, status) => setStatuses((prev) => ({ ...prev, [teacherId]: status }))

  const markAllPresent = () => setStatuses(Object.fromEntries(teachers.map((t) => [t.id, 'PRESENT'])))

  const submit = async () => {
    setServerError('')
    if (dateError) return
    const records = teachers.filter((t) => statuses[t.id]).map((t) => ({ teacherId: t.id, status: statuses[t.id] }))
    if (!records.length) {
      setServerError('Pick a status for at least one teacher.')
      return
    }
    setSubmitting(true)
    try {
      await teacherAttendanceApi.markBulk({ date, records })
      notify(`Attendance saved for ${records.length} teacher${records.length === 1 ? '' : 's'} on ${formatDate(date)}.`, 'success')
      reload()
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not save attendance.'))
    } finally {
      setSubmitting(false)
    }
  }

  const loading = teachersLoading || (!dateError && existingLoading && !existing)

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="sm:w-52">
            <Field label="Date" required error={dateError}>
              <input type="date" className={inputClass} value={date} max={todayInput()} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Find a teacher..." />
          <Button variant="secondary" icon={CheckCheck} onClick={markAllPresent} disabled={!teachers.length || !!dateError}>
            Mark all present
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
          {ATTENDANCE_STATUSES.map((s) => (
            <Badge key={s.value} tone={s.tone}>{s.label}: {counts[s.value]}</Badge>
          ))}
          <Badge tone="neutral">Not marked: {counts.unmarked}</Badge>
          {existingCount > 0 && (
            <span className="text-xs text-ink/50">
              {existingCount} record{existingCount === 1 ? '' : 's'} already saved for this date — saving updates them.
            </span>
          )}
        </div>
      </Card>

      {existingError && <Alert>{existingError}</Alert>}

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading}
          error={teachersError}
          empty={visible.length === 0}
          emptyState={
            <EmptyState
              icon={UserSquare2}
              title={teachers.length ? 'No matching teachers' : 'No active teachers'}
              message={teachers.length ? 'Try a different name.' : 'Add teachers before marking their attendance.'}
            />
          }
        >
          <ul className="divide-y divide-line">
            {visible.map((t) => (
              <li key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{t.name}</p>
                  <p className="text-xs text-ink/45 truncate">{[t.employeeId, t.subjectsTaught?.join(', ')].filter(Boolean).join(' · ')}</p>
                </div>
                <StatusSegment name={t.name} value={statuses[t.id]} onChange={(s) => setOne(t.id, s)} disabled={!!dateError} />
              </li>
            ))}
          </ul>
        </AsyncContent>
      </Card>

      <Alert>{serverError}</Alert>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
        <p className="text-sm text-ink/55">
          {counts.marked} of {teachers.length} marked
        </p>
        <Button onClick={submit} loading={submitting} disabled={!!dateError || !counts.marked}>
          Save attendance
        </Button>
      </div>
    </div>
  )
}
