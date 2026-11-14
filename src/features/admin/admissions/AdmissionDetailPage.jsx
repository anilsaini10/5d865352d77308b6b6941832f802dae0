import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, Pencil, Trash2, ArrowRight } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import {
  AsyncContent, Badge, Button, Card, ConfirmDialog, CredentialsBanner,
  Field, inputClass, selectClass, Modal, FormActions, Alert,
} from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage, getErrorCode } from '../../../api/httpClient.js'
import { formatDay, formatDateTime } from '../../../utils/format.js'
import { useClasses } from '../classes/useClasses.js'
import { GENDERS, enumMeta } from '../constants.js'
import { admissionsApi } from './admissions.api.js'

const STATUS_FLOW = ['INQUIRY', 'APPLIED', 'APPROVED', 'ENROLLED']

const STATUS_TONES = {
  INQUIRY: 'neutral',
  APPLIED: 'info',
  APPROVED: 'success',
  ENROLLED: 'primary',
  REJECTED: 'danger',
  WITHDRAWN: 'warning',
}

function StatusTimeline({ current }) {
  const currentIdx = STATUS_FLOW.indexOf(current)
  const isTerminal = current === 'REJECTED' || current === 'WITHDRAWN'

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= currentIdx && !isTerminal
        const isCurrent = s === current
        return (
          <div key={s} className="flex items-center gap-1">
            {i > 0 && <div className={`w-6 sm:w-10 h-0.5 ${done ? 'bg-board' : 'bg-line'}`} />}
            <div className="flex items-center gap-1.5">
              {done ? (
                <CheckCircle2 size={18} className={isCurrent ? 'text-board' : 'text-board/60'} />
              ) : (
                <Circle size={18} className="text-ink/20" />
              )}
              <span className={`text-xs font-semibold ${isCurrent ? 'text-ink' : 'text-ink/40'}`}>{s}</span>
            </div>
          </div>
        )
      })}
      {isTerminal && (
        <>
          <div className="w-6 h-0.5 bg-line" />
          <Badge tone={STATUS_TONES[current]}>{current}</Badge>
        </>
      )}
    </div>
  )
}

function EnrollModal({ open, onClose, admission, onEnrolled }) {
  const { classes, sectionsOf } = useClasses()
  const { notify } = useToast()
  const sections = admission?.classId ? sectionsOf(admission.classId) : []

  const [sectionId, setSectionId] = useState('')
  const [rollNo, setRollNo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await admissionsApi.enroll(admission.id, {
        sectionId,
        rollNo: Number(rollNo),
      })
      onEnrolled(result)
      onClose()
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'ROLL_NO_TAKEN') {
        const msg = getErrorMessage(err)
        setError(msg)
      } else if (code === 'NOT_APPROVED') {
        setError('Admission must be approved before enrollment.')
      } else {
        setError(getErrorMessage(err, 'Enrollment failed.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Enroll Student">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-ink/65">
          Enrolling <span className="font-semibold text-ink">{admission?.studentName}</span> into{' '}
          <span className="font-semibold text-ink">{admission?.class?.name ?? 'the applied class'}</span>.
          This will create a student record and a parent login.
        </p>
        <Field label="Section" required>
          <select className={selectClass} value={sectionId} onChange={(e) => setSectionId(e.target.value)} required>
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Roll Number" required>
          <input type="number" className={inputClass} value={rollNo} onChange={(e) => setRollNo(e.target.value)} min={1} required placeholder="e.g. 31" />
        </Field>
        {error && <Alert>{error}</Alert>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Enroll" />
      </form>
    </Modal>
  )
}

function EditModal({ open, onClose, admission, onSaved }) {
  const { notify } = useToast()
  const [remarks, setRemarks] = useState(admission?.remarks ?? '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await admissionsApi.update(admission.id, { remarks: remarks.trim() })
      notify('Admission updated.', 'success')
      onSaved()
      onClose()
    } catch (err) {
      notify(getErrorMessage(err, 'Update failed.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Admission">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Remarks">
          <textarea className={`${inputClass} min-h-[5rem]`} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </Field>
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Save" />
      </form>
    </Modal>
  )
}

export default function AdmissionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  const { data: admission, loading, error, reload } = useFetch(
    () => admissionsApi.get(id),
    [id],
    { errorMessage: 'Could not load admission details.' }
  )

  const [enrollOpen, setEnrollOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [enrollResult, setEnrollResult] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const changeStatus = async (newStatus, label) => {
    setActionLoading(true)
    try {
      await admissionsApi.update(id, { status: newStatus })
      notify(`Marked as ${label}.`, 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const confirmDelete = async () => {
    try {
      await admissionsApi.remove(id)
      notify('Admission deleted.', 'success')
      navigate('/admissions')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete.'), 'error')
    }
  }

  const handleEnrolled = (result) => {
    setEnrollResult(result)
    notify('Student enrolled successfully!', 'success')
    reload()
  }

  return (
    <AppShell title="Admission Detail" subtitle={admission?.applicationNo ?? ''} onBack={() => navigate('/admissions')}>
      <AsyncContent loading={loading} error={error} empty={!admission} emptyState={<p className="text-ink/50">Not found.</p>}>
        {admission && (
          <div className="space-y-6">
            {enrollResult && (
              <CredentialsBanner
                title={`${enrollResult.student?.name ?? 'Student'} is now enrolled`}
                description={enrollResult.parentAccount?.isNew
                  ? `Parent account created. Share these credentials with the parent.`
                  : 'Linked to existing parent account.'}
                loginId={enrollResult.parentAccount?.email}
                password={enrollResult.parentAccount?.defaultPassword}
                onDismiss={() => setEnrollResult(null)}
              >
                <div className="mt-2 text-sm text-on-board/70">
                  <p>Admission No: <span className="font-semibold text-on-board">{enrollResult.student?.admissionNo}</span></p>
                  <p>Class: {enrollResult.student?.className} – {enrollResult.student?.sectionName} · Roll {enrollResult.student?.rollNo}</p>
                </div>
              </CredentialsBanner>
            )}

            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">{admission.studentName}</h2>
                  <p className="text-sm text-ink/50 mt-0.5">{admission.applicationNo} · Created {formatDateTime(admission.createdAt)}</p>
                </div>
                <Badge tone={STATUS_TONES[admission.status]}>{admission.status}</Badge>
              </div>

              <StatusTimeline current={admission.status} />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <InfoItem label="Gender" value={enumMeta(GENDERS, admission.gender).label} />
                <InfoItem label="Date of Birth" value={formatDay(admission.dateOfBirth)} />
                <InfoItem label="Class" value={admission.class?.name ?? '—'} />
                <InfoItem label="Parent Name" value={admission.parentName} />
                <InfoItem label="Parent Phone" value={admission.parentPhone} />
                <InfoItem label="Parent Email" value={admission.parentEmail} />
                {admission.previousSchool && <InfoItem label="Previous School" value={admission.previousSchool} />}
                {admission.bloodGroup && <InfoItem label="Blood Group" value={admission.bloodGroup} />}
                {admission.address && <InfoItem label="Address" value={admission.address} />}
                {admission.academicSession && <InfoItem label="Session" value={admission.academicSession.name} />}
                {admission.remarks && <InfoItem label="Remarks" value={admission.remarks} className="sm:col-span-2" />}
              </div>
            </Card>

            <div className="flex flex-wrap gap-2">
              {admission.status === 'INQUIRY' && (
                <Button icon={ArrowRight} onClick={() => changeStatus('APPLIED', 'Applied')} loading={actionLoading}>
                  Mark as Applied
                </Button>
              )}
              {admission.status === 'APPLIED' && (
                <>
                  <Button onClick={() => changeStatus('APPROVED', 'Approved')} loading={actionLoading}>Approve</Button>
                  <Button variant="danger" onClick={() => changeStatus('REJECTED', 'Rejected')} loading={actionLoading}>Reject</Button>
                </>
              )}
              {admission.status === 'APPROVED' && (
                <Button onClick={() => setEnrollOpen(true)}>Enroll Student</Button>
              )}
              {admission.status !== 'ENROLLED' && admission.status !== 'WITHDRAWN' && (
                <Button variant="secondary" onClick={() => changeStatus('WITHDRAWN', 'Withdrawn')} loading={actionLoading}>Withdraw</Button>
              )}
              <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>Edit</Button>
              {admission.status !== 'ENROLLED' && (
                <Button variant="danger-ghost" icon={Trash2} onClick={() => setDeleteConfirm(true)}>Delete</Button>
              )}
            </div>

            <EnrollModal
              open={enrollOpen}
              onClose={() => setEnrollOpen(false)}
              admission={admission}
              onEnrolled={handleEnrolled}
            />

            <EditModal
              open={editOpen}
              onClose={() => setEditOpen(false)}
              admission={admission}
              onSaved={reload}
            />

            <ConfirmDialog
              open={deleteConfirm}
              onClose={() => setDeleteConfirm(false)}
              onConfirm={confirmDelete}
              title="Delete this admission?"
              confirmLabel="Delete"
              message={<p>Permanently delete the admission for <span className="font-semibold text-ink">{admission.studentName}</span>?</p>}
            />
          </div>
        )}
      </AsyncContent>
    </AppShell>
  )
}

function InfoItem({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-ink mt-0.5">{value ?? '—'}</p>
    </div>
  )
}
