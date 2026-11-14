import { useState } from 'react'
import { Modal, Field, inputClass, Alert, FormActions } from '../../../../components/ui.jsx'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { feesApi } from '../fees.api.js'

const TITLE_MAX = 200
const DESC_MAX = 2000

export default function FeeReminderModal({ studentIds, onClose, onSent }) {
  const [title, setTitle] = useState('Fees Reminder')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const errs = {}
    if (!title.trim()) errs.title = 'Title is required.'
    if (title.length > TITLE_MAX) errs.title = `Title must be under ${TITLE_MAX} characters.`
    if (!description.trim()) errs.description = 'Message is required.'
    if (description.length > DESC_MAX) errs.description = `Message must be under ${DESC_MAX} characters.`
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      await feesApi.sendReminder({ studentIds, title: title.trim(), description: description.trim() })
      onSent()
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not send reminder.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Send Fee Reminder">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-ink/60">
          Send a fee reminder notification to the parents of {studentIds.length} selected student{studentIds.length > 1 ? 's' : ''}.
        </p>

        <Field label="Title" required error={errors.title}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            maxLength={TITLE_MAX}
          />
        </Field>

        <Field label="Message" required error={errors.description}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} min-h-[100px] resize-y`}
            placeholder="Please clear the pending fee balance for your child..."
            maxLength={DESC_MAX}
          />
        </Field>

        {serverError && <Alert tone="error">{serverError}</Alert>}

        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Send Reminder" />
      </form>
    </Modal>
  )
}
