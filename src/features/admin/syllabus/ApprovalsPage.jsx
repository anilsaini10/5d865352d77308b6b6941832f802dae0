import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import {
  Card, AsyncContent, Table, THead, Th, Tr, Td, Badge, Button, Modal,
  Field, inputClass, FormActions, EmptyState, selectClass,
} from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { useClasses } from '../classes/useClasses.js'
import { subjectsApi } from '../subjects/subjects.api.js'
import { teachersApi } from '../teachers/teachers.api.js'
import { approvalsApi } from './syllabus.api.js'
import { currentSessionYear, sessionYearLabel } from './syllabus.constants.js'
import { validateApproveForm, validateRejectForm, validateCorrectionForm } from './syllabus.validation.js'
import { formatDate } from '../../../utils/format.js'

const YEARS = Array.from({ length: 5 }, (_, i) => currentSessionYear() - 2 + i)

export default function ApprovalsPage() {
  const { notify } = useToast()
  const { classes } = useClasses()
  const { data: subjectsList } = useFetch(() => subjectsApi.list(), [], { errorMessage: 'Could not load subjects.' })
  const { data: teachersList } = useFetch(() => teachersApi.listAll(), [], { errorMessage: 'Could not load teachers.' })

  const [sessionYear, setSessionYear] = useState(String(currentSessionYear()))
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')

  const { data: approvals, loading, error, reload } = useFetch(
    () => approvalsApi.list({
      sessionYear: Number(sessionYear),
      classId: classId || undefined,
      subjectId: subjectId || undefined,
      teacherId: teacherId || undefined,
    }),
    [sessionYear, classId, subjectId, teacherId],
    { enabled: !!sessionYear, errorMessage: 'Could not load approvals.' },
  )

  const items = approvals ?? []

  // ── Approve modal state ───────────────────────────────────────
  const [approveTarget, setApproveTarget] = useState(null)
  const [approvedPct, setApprovedPct] = useState('')
  const [approveErrors, setApproveErrors] = useState({})

  // ── Reject modal state ────────────────────────────────────────
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectionRemarks, setRejectionRemarks] = useState('')
  const [rejectErrors, setRejectErrors] = useState({})

  // ── Correction modal state ────────────────────────────────────
  const [correctionTarget, setCorrectionTarget] = useState(null)
  const [correctionPct, setCorrectionPct] = useState('')
  const [correctionRemarks, setCorrectionRemarks] = useState('')
  const [correctionErrors, setCorrectionErrors] = useState({})

  const [submitting, setSubmitting] = useState(false)

  const openApprove = (a) => {
    setApproveTarget(a)
    setApprovedPct(String(a.submittedPercentage ?? ''))
    setApproveErrors({})
  }

  const openReject = (a) => {
    setRejectTarget(a)
    setRejectionRemarks('')
    setRejectErrors({})
  }

  const openCorrection = (a) => {
    setCorrectionTarget(a)
    setCorrectionPct('')
    setCorrectionRemarks('')
    setCorrectionErrors({})
  }

  const handleApprove = async (e) => {
    e.preventDefault()
    const errs = validateApproveForm({ approvedPercentage: approvedPct })
    if (Object.keys(errs).length) { setApproveErrors(errs); return }
    setSubmitting(true)
    try {
      await approvalsApi.review(approveTarget.id, { status: 'APPROVED', approvedPercentage: Number(approvedPct) })
      notify('Progress approved successfully.', 'success')
      setApproveTarget(null)
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not approve.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (e) => {
    e.preventDefault()
    const errs = validateRejectForm({ rejectionRemarks })
    if (Object.keys(errs).length) { setRejectErrors(errs); return }
    setSubmitting(true)
    try {
      await approvalsApi.review(rejectTarget.id, { status: 'REJECTED', rejectionRemarks })
      notify('Progress rejected.', 'success')
      setRejectTarget(null)
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not reject.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCorrection = async (e) => {
    e.preventDefault()
    const errs = validateCorrectionForm({ completionPercentage: correctionPct, correctionRemarks })
    if (Object.keys(errs).length) { setCorrectionErrors(errs); return }
    setSubmitting(true)
    try {
      await approvalsApi.correct(correctionTarget.id, {
        completionPercentage: Number(correctionPct),
        correctionRemarks,
      })
      notify('Progress corrected successfully.', 'success')
      setCorrectionTarget(null)
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not correct progress.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell title="Syllabus Approvals" subtitle="Pending progress approvals">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
        <select className={`${selectClass} sm:w-44`} value={sessionYear} onChange={(e) => setSessionYear(e.target.value)}>
          {YEARS.map((y) => <option key={y} value={y}>{sessionYearLabel(y)}</option>)}
        </select>
        <select className={`${selectClass} sm:w-44`} value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">All classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={`${selectClass} sm:w-44`} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">All subjects</option>
          {(subjectsList ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={`${selectClass} sm:w-44`} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
          <option value="">All teachers</option>
          {(teachersList ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <Card>
        <AsyncContent
          loading={loading}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={ClipboardCheck}
              title="No pending approvals"
              message="All progress submissions have been reviewed."
            />
          }
        >
          <Table>
            <THead>
              <Th>Chapter</Th>
              <Th>Class / Section</Th>
              <Th>Subject</Th>
              <Th>Teacher</Th>
              <Th>Submitted %</Th>
              <Th>Submitted At</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {items.map((a) => (
                <Tr key={a.id}>
                  <Td className="font-semibold text-ink whitespace-nowrap">
                    Ch {a.chapter?.chapterNumber} — {a.chapter?.name}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {a.plan?.class?.name} / {a.plan?.section?.name}
                  </Td>
                  <Td className="whitespace-nowrap">{a.plan?.subject?.name}</Td>
                  <Td className="whitespace-nowrap">{a.plan?.teacher?.user?.name || '—'}</Td>
                  <Td>
                    <Badge tone="warning">{a.submittedPercentage}%</Badge>
                  </Td>
                  <Td className="whitespace-nowrap">{formatDate(a.createdAt)}</Td>
                  <Td className="text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <Button size="sm" variant="primary" onClick={() => openApprove(a)}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => openReject(a)}>Reject</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {/* ── Approve Modal ─────────────────────────────────────────── */}
      <Modal open={!!approveTarget} onClose={() => setApproveTarget(null)} title="Approve Progress">
        {approveTarget && (
          <form onSubmit={handleApprove}>
            <p className="text-sm text-ink/70 mb-4">
              <span className="font-semibold text-ink">{approveTarget.chapter?.name}</span> — teacher submitted{' '}
              <span className="font-semibold">{approveTarget.submittedPercentage}%</span>
            </p>
            <Field label="Approved Percentage" required error={approveErrors.approvedPercentage}>
              <input
                type="number"
                min={0}
                max={100}
                step="any"
                className={inputClass}
                value={approvedPct}
                onChange={(e) => setApprovedPct(e.target.value)}
              />
            </Field>
            <FormActions onCancel={() => setApproveTarget(null)} submitting={submitting} submitLabel="Approve" />
          </form>
        )}
      </Modal>

      {/* ── Reject Modal ──────────────────────────────────────────── */}
      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Progress">
        {rejectTarget && (
          <form onSubmit={handleReject}>
            <p className="text-sm text-ink/70 mb-4">
              <span className="font-semibold text-ink">{rejectTarget.chapter?.name}</span> — teacher submitted{' '}
              <span className="font-semibold">{rejectTarget.submittedPercentage}%</span>
            </p>
            <Field label="Rejection Remarks" required error={rejectErrors.rejectionRemarks}>
              <textarea
                rows={3}
                className={inputClass}
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                placeholder="Reason for rejection..."
              />
            </Field>
            <FormActions onCancel={() => setRejectTarget(null)} submitting={submitting} submitLabel="Reject" />
          </form>
        )}
      </Modal>

      {/* ── Correction Modal ──────────────────────────────────────── */}
      <Modal open={!!correctionTarget} onClose={() => setCorrectionTarget(null)} title="Admin Correction">
        {correctionTarget && (
          <form onSubmit={handleCorrection}>
            <div className="space-y-4">
              <Field label="Completion Percentage" required error={correctionErrors.completionPercentage}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  className={inputClass}
                  value={correctionPct}
                  onChange={(e) => setCorrectionPct(e.target.value)}
                />
              </Field>
              <Field label="Correction Remarks" required error={correctionErrors.correctionRemarks}>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={correctionRemarks}
                  onChange={(e) => setCorrectionRemarks(e.target.value)}
                  placeholder="Reason for correction..."
                />
              </Field>
            </div>
            <FormActions onCancel={() => setCorrectionTarget(null)} submitting={submitting} submitLabel="Save Correction" />
          </form>
        )}
      </Modal>
    </AppShell>
  )
}
