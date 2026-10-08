import { useEffect, useState } from 'react'
import { Alert, Button, Field, Modal, WarningNote, inputClass } from '../../../../components/ui.jsx'
import { getErrorCode, getErrorMessage } from '../../../../api/httpClient.js'
import { useToast } from '../../../../context/ToastContext.jsx'
import { formatDateRange } from '../../../../utils/format.js'
import { leaveApi } from '../leave.api.js'
import { validateReview, REVIEW_REMARKS_MAX } from '../leave.validation.js'
import { leaveDays } from '../leave.utils.js'

/**
 * target: { leave, kind: 'student' | 'teacher', status: 'APPROVED' | 'REJECTED' }.
 * onReviewed() is called after success and after a 409 (someone else reviewed it).
 */
export default function LeaveReviewModal({ target, onClose, onReviewed }) {
  const { notify } = useToast()
  const [remarks, setRemarks] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setRemarks('')
    setErrors({})
    setServerError('')
  }, [target])

  if (!target) return null
  const { leave, kind, status } = target
  const approving = status === 'APPROVED'
  const who = kind === 'student' ? leave.studentName : leave.teacherName
  const days = leaveDays(leave.fromDate, leave.toDate)

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validationErrors = validateReview({ reviewRemarks: remarks })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) return

    const body = { status, reviewRemarks: remarks.trim() || undefined }
    setSubmitting(true)
    try {
      if (kind === 'student') await leaveApi.reviewStudent(leave.id, body)
      else await leaveApi.reviewTeacher(leave.id, body)
      notify(`Leave for ${who} ${approving ? 'approved' : 'rejected'}.`, 'success')
      onReviewed()
      onClose()
    } catch (err) {
      if (getErrorCode(err) === 'LEAVE_ALREADY_REVIEWED') {
        notify('This request was already reviewed. The list has been refreshed.', 'error')
        onReviewed()
        onClose()
      } else {
        setServerError(getErrorMessage(err, 'Could not review this request.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={approving ? 'Approve leave' : 'Reject leave'}
      subtitle={`${who} · ${formatDateRange(leave.fromDate, leave.toDate)} (${days} day${days === 1 ? '' : 's'})`}
    >
      <form onSubmit={submit} className="space-y-4">
        {leave.reason && (
          <div className="text-sm text-ink/70 bg-line/20 border border-line rounded-lg px-3 py-2">
            <span className="font-semibold text-ink">Reason: </span>
            {leave.reason}
          </div>
        )}

        {approving && (
          <WarningNote>
            {kind === 'student'
              ? `Approving marks ${leave.studentName}'s attendance as Leave for every day in this range and notifies the parent.`
              : `${leave.teacherName} will be notified that their leave was approved.`}{' '}
            A request can only be reviewed once.
          </WarningNote>
        )}
        {!approving && (
          <p className="text-sm text-ink/60">
            {kind === 'student' ? 'The parent' : leave.teacherName} will be notified. A request can only be reviewed once.
          </p>
        )}

        <Field label="Remarks" error={errors.reviewRemarks} hint={`Optional, shared with ${kind === 'student' ? 'the parent' : 'the teacher'}.`}>
          <textarea
            className={`${inputClass} min-h-[88px]`}
            value={remarks}
            maxLength={REVIEW_REMARKS_MAX + 50}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={approving ? 'e.g. Get well soon' : 'e.g. Exams are scheduled on these dates'}
          />
        </Field>

        <Alert>{serverError}</Alert>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={approving ? 'primary' : 'danger'} loading={submitting}>
            {approving ? 'Approve' : 'Reject'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
