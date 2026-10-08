import { useEffect, useState } from 'react'
import { Modal, Field, inputClass, selectClass, Alert, FormActions } from '../../../../components/ui.jsx'
import { getErrorMessage, getErrorCode } from '../../../../api/httpClient.js'
import { examsApi } from '../exams.api.js'
import { validateMaxMarks } from '../exams.validation.js'

/** `availableClasses` excludes classes already assigned to the exam. */
export default function AddExamClassModal({ open, onClose, examId, availableClasses, onSaved }) {
  const [classId, setClassId] = useState('')
  const [maxMarks, setMaxMarks] = useState('100')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setClassId('')
      setMaxMarks('100')
    }
    setErrors({})
    setServerError('')
  }, [open])

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validationErrors = {}
    if (!classId) validationErrors.classId = 'Select a class.'
    const marksError = validateMaxMarks(maxMarks)
    if (marksError) validationErrors.maxMarks = marksError
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      await examsApi.addClass(examId, { classId, maxMarks: Number(maxMarks) })
      onSaved(availableClasses.find((c) => c.id === classId))
      onClose()
    } catch (err) {
      if (getErrorCode(err) === 'EXAM_CLASS_ALREADY_ASSIGNED') {
        setErrors({ classId: 'This class is already part of this exam.' })
      } else {
        setServerError(getErrorMessage(err, 'Could not add the class.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add class" subtitle="Assign another class to this exam">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Class" required error={errors.classId} hint={availableClasses.length === 0 ? 'Every class is already assigned.' : undefined}>
          <select className={selectClass} value={classId} onChange={(e) => setClassId(e.target.value)} autoFocus>
            <option value="">Select a class</option>
            {availableClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Max marks" required error={errors.maxMarks}>
          <input type="number" min="1" step="any" inputMode="decimal" className={inputClass} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
        </Field>
        <Alert>{serverError}</Alert>
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Add class" />
      </form>
    </Modal>
  )
}
