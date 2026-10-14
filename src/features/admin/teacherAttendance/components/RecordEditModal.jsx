import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { Modal, Field, Alert, FormActions, selectClass } from '../../../../components/ui.jsx'
import { ATTENDANCE_STATUSES } from '../../constants.js'
import { formatClock, formatDay, formatWorked, mapLink } from '../teacherAttendance.utils.js'

function Pin({ lat, lng }) {
  const url = mapLink(lat, lng)
  return url ? <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-board font-semibold hover:underline"><MapPin size={13} /> Map</a> : null
}

function Info({ label, children }) {
  return (
    <div>
      <p className="text-xs text-ink/45">{label}</p>
      <p className="text-sm font-semibold text-ink flex items-center gap-2">{children}</p>
    </div>
  )
}

/** Teacher's check-in/out are read-only; only the admin status is editable. `row.id` null → first mark (POST). */
export default function RecordEditModal({ open, onClose, row, name, onSave }) {
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && row) setStatus(row.adminStatus ?? row.teacherStatus ?? '')
    setError('')
  }, [open, row])

  if (!row) return null
  const unchanged = !status || status === row.adminStatus

  const submit = async (e) => {
    e.preventDefault()
    if (unchanged) {
      onClose()
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSave(row, status)
      onClose()
    } catch (err) {
      setError(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={row.id ? 'Edit attendance' : 'Mark attendance'} subtitle={`${name} · ${formatDay(row.date)}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-line bg-line/20 p-4">
          <Info label="Check-in">{row.teacherMarkedAt ? <>{formatClock(row.teacherMarkedAt)} <Pin lat={row.teacherLatitude} lng={row.teacherLongitude} /></> : '—'}</Info>
          <Info label="Check-out">{row.teacherCheckOutAt ? <>{formatClock(row.teacherCheckOutAt)} <Pin lat={row.teacherCheckOutLatitude} lng={row.teacherCheckOutLongitude} /></> : '—'}</Info>
          <Info label="Worked">{formatWorked(row.workedMinutes)}</Info>
          <Info label="Admin mark">{row.adminMarkedBy ? `${row.adminMarkedBy.name}${row.adminMarkedAt ? `, ${formatClock(row.adminMarkedAt)}` : ''}` : 'Not marked'}</Info>
        </div>
        <p className="text-xs text-ink/50">Check-in and check-out come from the teacher app and can’t be edited here.</p>

        <Field label="Admin status" required>
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)} autoFocus>
            {!row.adminStatus && <option value="">Select status…</option>}
            {ATTENDANCE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Alert>{error ? error.message : ''}</Alert>
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Save" />
      </form>
    </Modal>
  )
}
