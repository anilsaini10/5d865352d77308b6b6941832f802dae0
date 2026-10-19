import { KeyRound } from 'lucide-react'
import { Modal, Badge, Button, PageLoader } from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { formatDate } from '../../../../utils/format.js'
import { GENDERS, enumMeta } from '../../constants.js'
import { studentsApi } from '../students.api.js'

function Detail({ label, children, wide = false }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</dt>
      <dd className="text-sm text-ink mt-0.5 break-words">{children || '—'}</dd>
    </div>
  )
}

function Group({ title, children }) {
  return (
    <section>
      <h3 className="font-display font-semibold text-ink mb-3">{title}</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">{children}</dl>
    </section>
  )
}

function AttendanceMeter({ value }) {
  if (value == null) return <span className="text-ink/50">No attendance recorded yet</span>
  const pct = Math.max(0, Math.min(100, Number(value)))
  const tone = pct >= 75 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-coral'
  return (
    <div className="flex items-center gap-3">
      <span className="font-semibold">{pct.toFixed(1)}%</span>
      <div className="flex-1 max-w-48 h-2 rounded-full bg-line/60 overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** Read-only view of every student field. Refetches so the data is fresh. */
export default function StudentDetailsModal({ student: row, onClose, onEdit, onResetParentPassword }) {
  const { data, loading } = useFetch(() => studentsApi.get(row.id), [row?.id], {
    enabled: !!row,
    errorMessage: 'Could not refresh student details.',
  })
  if (!row) return null
  const s = data ?? row
  const inactive = s.status === 'INACTIVE'

  return (
    <Modal open onClose={onClose} wide title={s.name} subtitle={`Admission no. ${s.admissionNo ?? '—'}`}>
      {loading && !data ? (
        <PageLoader />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={inactive ? 'inactive' : 'active'}>{inactive ? 'Deleted' : 'Active'}</Badge>
            <Badge tone="primary">
              {s.className}
              {s.sectionName ? ` – ${s.sectionName}` : ''}
            </Badge>
            <Badge tone="neutral">Roll {s.rollNo ?? '—'}</Badge>
          </div>

          <Group title="Student details">
            <Detail label="Gender">{enumMeta(GENDERS, s.gender).label}</Detail>
            <Detail label="Date of birth">{s.dateOfBirth ? formatDate(s.dateOfBirth) : null}</Detail>
            <Detail label="Attendance" wide>
              <AttendanceMeter value={s.attendancePercentage} />
            </Detail>
          </Group>

          <Group title="Parent">
            <Detail label="Name">{s.parentName}</Detail>
            <Detail label="Phone">{s.parentPhone}</Detail>
            <Detail label="Email (login)" wide>{s.parentEmail}</Detail>
            {onResetParentPassword && s.parentUserId && (
              <div className="sm:col-span-2">
                <Button variant="secondary" size="sm" icon={KeyRound} onClick={() => onResetParentPassword(s)}>Reset parent password</Button>
              </div>
            )}
          </Group>

          <Group title="Other">
            <Detail label="Blood group">{s.bloodGroup}</Detail>
            <Detail label="Address" wide>{s.address}</Detail>
          </Group>

          {onEdit && (
            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => onEdit(s)}>Edit student</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
