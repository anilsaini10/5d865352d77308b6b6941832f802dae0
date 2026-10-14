import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ClipboardList, Clock, Download, MapPin, Pencil, UserCheck } from 'lucide-react'
import Pagination from '../../../../components/Pagination.jsx'
import {
  Alert, AsyncContent, Badge, Button, Card, EmptyState, Field, Table, THead, Th, Tr, Td, inputClass, selectClass,
} from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { useToast } from '../../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { todayInput } from '../../../../utils/format.js'
import { ATTENDANCE_STATUSES, enumMeta } from '../../constants.js'
import { teacherAttendanceApi } from '../teacherAttendance.api.js'
import { schoolApi } from '../../school/school.api.js'
import { validateHistoryRange } from '../teacherAttendance.validation.js'
import {
  distanceMeters, downloadCsv, fetchAll, fetchAllForDate, formatClock, formatDay, formatDistance, formatWorked, isMismatch, isNotCheckedOut, mapLink, mismatchTitle,
  recordsToCsv, statusLabel,
} from '../teacherAttendance.utils.js'
import RecordEditModal from './RecordEditModal.jsx'
import BulkMarkModal from './BulkMarkModal.jsx'
import TeacherMonthView from './TeacherMonthView.jsx'

const PAGE_SIZE = 20

function StatusBadge({ value }) {
  const meta = enumMeta(ATTENDANCE_STATUSES, value)
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

function Chip({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors disabled:opacity-40 ${
        active ? 'bg-board text-on-board border-board' : 'bg-surface border-line text-ink/65 hover:bg-line/40'
      }`}
    >
      {children}
    </button>
  )
}

function StatusSelect({ label, value, onChange }) {
  return (
    <Field label={label}>
      <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        {ATTENDANCE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </Field>
  )
}

function TimeCell({ at, lat, lng, empty = '—' }) {
  if (!at) return <span className="text-ink/40">{empty}</span>
  const url = mapLink(lat, lng)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-medium text-ink">{formatClock(at)}</span>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" aria-label="Open location in Google Maps" title="Open location in Google Maps" className="text-board hover:text-board-light">
          <MapPin size={14} />
        </a>
      )}
    </span>
  )
}

/**
 * Distance of a check-in/out point from the school. Without school coordinates there's nothing to
 * measure against, so it falls back to a button that opens the point itself on the map.
 */
function DistanceCell({ school, lat, lng }) {
  if (lat == null || lng == null) return <span className="text-ink/40">—</span>
  if (school?.latitude != null && school?.longitude != null) {
    return <span className="font-medium text-ink">{formatDistance(distanceMeters(school.latitude, school.longitude, lat, lng))}</span>
  }
  return (
    <a href={mapLink(lat, lng)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-xs font-semibold text-board hover:bg-line/40">
      <MapPin size={13} /> View on map
    </a>
  )
}

function SummaryBar({ rows }) {
  const c = Object.fromEntries(ATTENDANCE_STATUSES.map((s) => [s.value, 0]))
  rows.forEach((r) => { if (r.status) c[r.status] += 1 })
  const viaApp = rows.filter((r) => r.teacherMarkedAt).length
  const notOut = rows.filter(isNotCheckedOut).length
  const notMarked = rows.filter((r) => !r.status).length
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5 text-sm">
      {ATTENDANCE_STATUSES.map((s) => <Badge key={s.value} tone={s.tone}>{s.label}: {c[s.value]}</Badge>)}
      <span className="mx-1 text-ink/20">|</span>
      <Badge tone="info">Checked in via app: {viaApp}</Badge>
      <Badge tone={notOut ? 'warning' : 'neutral'}>Not checked out: {notOut}</Badge>
      <Badge tone={notMarked ? 'danger' : 'neutral'}>Not marked: {notMarked}</Badge>
    </div>
  )
}

/**
 * mode 'day'   — the daily register: one date, merged with the active teacher list so teachers
 *                with no record still show up (and can be marked).
 * mode 'range' — paginated history over a date range, records only, with per-teacher month view + CSV.
 */
export default function AttendanceRegisterTab({ mode, teachers }) {
  const { notify } = useToast()
  const isDay = mode === 'day'
  const [date, setDate] = useState(todayInput())
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')
  const [teacherStatus, setTeacherStatus] = useState('')
  const [adminStatus, setAdminStatus] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [notCheckedIn, setNotCheckedIn] = useState(false)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const rangeError = isDay ? '' : validateHistoryRange({ mode: 'range', from, to })
  const mismatchOnly = teacherStatus === 'PRESENT' && adminStatus === 'ABSENT'
  const viaAppOnly = teacherStatus === 'PRESENT' && !adminStatus && !status
  const serverFiltered = !!(status || teacherStatus || adminStatus)

  useEffect(() => setPage(1), [from, to, status, teacherStatus, adminStatus, teacherId])

  const filters = { status, teacherStatus, adminStatus, teacherId }
  const { data, setData, loading, error, reload } = useFetch(
    () => (isDay ? fetchAllForDate(date, filters) : teacherAttendanceApi.list({ page, pageSize: PAGE_SIZE, from, to, ...filters })),
    [isDay, date, from, to, page, status, teacherStatus, adminStatus, teacherId],
    { errorMessage: 'Could not load attendance.', enabled: !rangeError }
  )
  const records = isDay ? data ?? [] : data?.items ?? []
  const { data: school } = useFetch(() => schoolApi.get(), [], { errorMessage: 'Could not load school location.' })
  const teacherById = useMemo(() => Object.fromEntries(teachers.map((t) => [t.id, t])), [teachers])

  // Day mode: add a placeholder row for each teacher without a record, unless a status filter is on.
  const merged = useMemo(() => {
    if (rangeError) return []
    if (!isDay || serverFiltered) return records
    const have = new Set(records.map((r) => r.teacherId))
    const missing = teachers
      .filter((t) => !have.has(t.id) && (!teacherId || t.id === teacherId))
      .map((t) => ({ id: null, teacherId: t.id, teacherName: t.name, employeeId: t.employeeId, date, status: null }))
    return [...records, ...missing].sort((a, b) => (a.teacherName ?? '').localeCompare(b.teacherName ?? ''))
  }, [records, teachers, isDay, serverFiltered, teacherId, date, rangeError])
  const rows = notCheckedIn ? merged.filter((r) => !r.teacherStatus) : merged

  const nameOf = (r) => r.teacherName ?? teacherById[r.teacherId]?.name ?? 'Unknown teacher'
  const empIdOf = (r) => r.employeeId ?? teacherById[r.teacherId]?.employeeId

  const saveAdminStatus = async (r, next) => {
    try {
      if (r.id) {
        const updated = await teacherAttendanceApi.update(r.id, next)
        const merge = (x) => (x.id === r.id ? { ...x, ...(updated && typeof updated === 'object' ? updated : { adminStatus: next, status: next }) } : x)
        setData((prev) => (isDay ? prev.map(merge) : { ...prev, items: prev.items.map(merge) }))
      } else {
        await teacherAttendanceApi.markBulk({ date: r.date, records: [{ teacherId: r.teacherId, status: next }] })
        reload()
      }
      notify(`${nameOf(r)} marked ${statusLabel(next).toLowerCase()} for ${formatDay(r.date)}.`, 'success')
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Could not update the record.'))
    }
  }

  const resetQuick = () => setNotCheckedIn(false)
  const toggleMismatch = () => {
    resetQuick()
    setStatus('')
    setTeacherStatus(mismatchOnly ? '' : 'PRESENT')
    setAdminStatus(mismatchOnly ? '' : 'ABSENT')
  }
  const toggleViaApp = () => {
    resetQuick()
    setStatus('')
    setAdminStatus('')
    setTeacherStatus(viaAppOnly ? '' : 'PRESENT')
  }
  const toggleNotCheckedIn = () => {
    setStatus('')
    setTeacherStatus('')
    setAdminStatus('')
    setNotCheckedIn((v) => !v)
  }
  const onFilter = (setter) => (value) => {
    resetQuick()
    setter(value)
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const all = await fetchAll({ from, to, ...filters })
      downloadCsv(`teacher-attendance_${from || 'all'}_${to || 'all'}.csv`, recordsToCsv(all))
    } catch (err) {
      notify(getErrorMessage(err, 'Could not export attendance.'), 'error')
    } finally {
      setExporting(false)
    }
  }

  const pageable = !isDay && !loading && !error && !rangeError && records.length > 0
  const monthTeacher = !isDay ? teacherById[teacherId] : null

  return (
    <div>
      <Card className="p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {isDay ? (
            <Field label="Date">
              <input type="date" className={inputClass} value={date} max={todayInput()} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              <Field label="From">
                <input type="date" className={inputClass} value={from} max={to || todayInput()} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="To">
                <input type="date" className={inputClass} value={to} min={from || undefined} max={todayInput()} onChange={(e) => setTo(e.target.value)} />
              </Field>
            </div>
          )}
          <StatusSelect label="Final status" value={status} onChange={onFilter(setStatus)} />
          <StatusSelect label="Self check-in" value={teacherStatus} onChange={onFilter(setTeacherStatus)} />
          <StatusSelect label="Admin status" value={adminStatus} onChange={onFilter(setAdminStatus)} />
          <Field label="Teacher">
            <select className={selectClass} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">All teachers</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Chip active={mismatchOnly} onClick={toggleMismatch}>Checked in but marked Absent</Chip>
          <Chip active={viaAppOnly} onClick={toggleViaApp}>Checked in via app</Chip>
          {isDay && <Chip active={notCheckedIn} onClick={toggleNotCheckedIn}>Not checked in</Chip>}
          <div className="ml-auto flex gap-2">
            {isDay ? (
              <Button size="sm" icon={UserCheck} onClick={() => setBulkOpen(true)} disabled={!teachers.length}>Mark attendance</Button>
            ) : (
              <Button size="sm" variant="secondary" icon={Download} onClick={exportCsv} loading={exporting} disabled={!!rangeError || (!from && !to)} title={!from && !to ? 'Pick a date range to export' : undefined}>
                Export CSV
              </Button>
            )}
          </div>
        </div>
        {rangeError && <Alert className="mt-3">{rangeError}</Alert>}
      </Card>

      {monthTeacher && <TeacherMonthView teacher={monthTeacher} />}

      {isDay && !loading && !error && <SummaryBar rows={merged} />}

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading && !data}
          error={error}
          empty={rows.length === 0}
          emptyState={<EmptyState icon={ClipboardList} title="No records" message="No teacher attendance matches these filters." />}
        >
          <Table className={loading ? 'opacity-60' : ''}>
            <THead>
              {!isDay && <Th>Date</Th>}
              <Th>Teacher</Th>
              <Th>Teacher status</Th>
              <Th>Check-in</Th>
              <Th>Check-out</Th>
              <Th>Check-in distance</Th>
              <Th>Check-out distance</Th>
              <Th>Worked</Th>
              <Th>Admin status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {rows.map((r) => {
                const mismatch = isMismatch(r)
                const notOut = isNotCheckedOut(r)
                const none = !r.id
                return (
                  <Tr key={r.id ?? `t-${r.teacherId}`} className={mismatch ? 'bg-chalk/10' : ''}>
                    {!isDay && <Td className="whitespace-nowrap">{formatDay(r.date)}</Td>}
                    <Td className="whitespace-nowrap">
                      <p className="font-semibold text-ink inline-flex items-center gap-1.5">
                        {nameOf(r)}
                        {mismatch && <span title={mismatchTitle(r)} aria-label={mismatchTitle(r)}><AlertTriangle size={14} className="text-warning" /></span>}
                      </p>
                      {empIdOf(r) && <p className="text-xs text-ink/45">{empIdOf(r)}</p>}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {r.teacherStatus ? <StatusBadge value={r.teacherStatus} /> : <span className="text-ink/40">Not marked</span>}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <TimeCell at={r.teacherMarkedAt} lat={r.teacherLatitude} lng={r.teacherLongitude} />
                    </Td>
                    <Td className="whitespace-nowrap">
                      {r.teacherMarkedAt && !r.teacherCheckOutAt ? (
                        <span className={`inline-flex items-center gap-1 text-xs ${notOut ? 'text-warning font-semibold' : 'text-ink/45'}`}>
                          {notOut && <Clock size={13} />} Not checked out
                        </span>
                      ) : (
                        <TimeCell at={r.teacherCheckOutAt} lat={r.teacherCheckOutLatitude} lng={r.teacherCheckOutLongitude} />
                      )}
                    </Td>
                    <Td className="whitespace-nowrap"><DistanceCell school={school} lat={r.teacherLatitude} lng={r.teacherLongitude} /></Td>
                    <Td className="whitespace-nowrap"><DistanceCell school={school} lat={r.teacherCheckOutLatitude} lng={r.teacherCheckOutLongitude} /></Td>
                    <Td className="whitespace-nowrap">{formatWorked(r.workedMinutes)}</Td>
                    <Td className="whitespace-nowrap">
                      {r.adminStatus ? (
                        <>
                          <StatusBadge value={r.adminStatus} />
                          {(r.adminMarkedBy || r.adminMarkedAt) && (
                            <p className="text-xs text-ink/45 mt-1">
                              {[r.adminMarkedBy?.name && `by ${r.adminMarkedBy.name}`, r.adminMarkedAt && formatClock(r.adminMarkedAt)].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </>
                      ) : <span className="text-ink/40">Not marked</span>}
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(r)}>{none ? 'Mark' : 'Edit'}</Button>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {pageable && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}

      <RecordEditModal open={!!editing} onClose={() => setEditing(null)} row={editing} name={editing ? nameOf(editing) : ''} onSave={saveAdminStatus} />

      {isDay && <BulkMarkModal open={bulkOpen} onClose={() => setBulkOpen(false)} date={date} teachers={teachers} onSaved={reload} />}
    </div>
  )
}
