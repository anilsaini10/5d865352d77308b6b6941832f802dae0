import { useEffect, useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import Pagination from '../../../../components/Pagination.jsx'
import {
  Alert, AsyncContent, Badge, Card, EmptyState, Field, Table, Tabs, THead, Th, Tr, Td, inputClass, selectClass,
} from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { useToast } from '../../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { formatDate, todayInput } from '../../../../utils/format.js'
import { ATTENDANCE_STATUSES, enumMeta } from '../../constants.js'
import { teacherAttendanceApi } from '../teacherAttendance.api.js'
import { validateHistoryRange } from '../teacherAttendance.validation.js'

const PAGE_SIZE = 20

const MODES = [
  { value: 'date', label: 'Single day' },
  { value: 'range', label: 'Date range' },
]

export default function AttendanceHistoryTab({ teachers }) {
  const { notify } = useToast()
  const [mode, setMode] = useState('date')
  const [date, setDate] = useState(todayInput())
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [page, setPage] = useState(1)
  const [savingId, setSavingId] = useState(null)

  const rangeError = validateHistoryRange({ mode, from, to })

  useEffect(() => {
    setPage(1)
  }, [mode, date, from, to, status, teacherId])

  // Only one of date / from-to is ever sent.
  const query = mode === 'date' ? { date } : { from, to }

  const { data, setData, loading, error } = useFetch(
    () => teacherAttendanceApi.list({ page, pageSize: PAGE_SIZE, ...query, status, teacherId }),
    [page, mode, date, from, to, status, teacherId],
    { errorMessage: 'Could not load attendance history.', enabled: !rangeError }
  )
  const records = rangeError ? [] : data?.items ?? []

  const nameById = useMemo(() => Object.fromEntries(teachers.map((t) => [t.id, t.name])), [teachers])
  const nameOf = (r) => r.teacherName ?? r.teacher?.name ?? nameById[r.teacherId] ?? 'Unknown teacher'

  const correct = async (record, next) => {
    if (next === record.status) return
    setSavingId(record.id)
    try {
      const updated = await teacherAttendanceApi.update(record.id, next)
      setData((prev) => ({
        ...prev,
        items: prev.items.map((r) => (r.id === record.id ? { ...r, ...(updated && typeof updated === 'object' ? updated : {}), status: next } : r)),
      }))
      notify(`${nameOf(record)} marked ${enumMeta(ATTENDANCE_STATUSES, next).label.toLowerCase()} for ${formatDate(record.date)}.`, 'success')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not update the record.'), 'error')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <Card className="p-5 mb-5">
        <div className="mb-4">
          <Tabs options={MODES} value={mode} onChange={setMode} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {mode === 'date' ? (
            <Field label="Date">
              <input type="date" className={inputClass} value={date} max={todayInput()} onChange={(e) => setDate(e.target.value)} />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-2">
              <Field label="From">
                <input type="date" className={inputClass} value={from} max={to || todayInput()} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="To">
                <input type="date" className={inputClass} value={to} min={from || undefined} max={todayInput()} onChange={(e) => setTo(e.target.value)} />
              </Field>
            </div>
          )}
          <Field label="Status">
            <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {ATTENDANCE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Teacher">
            <select className={selectClass} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">All teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
        </div>
        {rangeError && <Alert className="mt-3">{rangeError}</Alert>}
      </Card>

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading}
          error={error}
          empty={records.length === 0}
          emptyState={<EmptyState icon={ClipboardList} title="No records" message="No teacher attendance matches these filters." />}
        >
          <Table>
            <THead>
              <Th>Date</Th>
              <Th>Teacher</Th>
              <Th>Status</Th>
              <Th>Correct status</Th>
            </THead>
            <tbody>
              {records.map((r) => {
                const meta = enumMeta(ATTENDANCE_STATUSES, r.status)
                return (
                  <Tr key={r.id}>
                    <Td className="whitespace-nowrap">{formatDate(r.date)}</Td>
                    <Td className="font-semibold text-ink whitespace-nowrap">{nameOf(r)}</Td>
                    <Td>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </Td>
                    <Td>
                      <select
                        className={`${selectClass} py-1.5 min-w-[8rem]`}
                        value={r.status}
                        disabled={savingId === r.id}
                        onChange={(e) => correct(r, e.target.value)}
                        aria-label={`Correct status for ${nameOf(r)}`}
                      >
                        {ATTENDANCE_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {!loading && !error && records.length > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}
    </div>
  )
}
