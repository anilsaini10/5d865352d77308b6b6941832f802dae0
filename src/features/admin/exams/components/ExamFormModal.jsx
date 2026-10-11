import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Modal, Field, inputClass, selectClass, Alert, Button, FormActions, IconButton } from '../../../../components/ui.jsx'
import { getErrorCode, getErrorMessage } from '../../../../api/httpClient.js'
import { toDateInput } from '../../../../utils/format.js'
import { examsApi } from '../exams.api.js'
import { validateExamForm } from '../exams.validation.js'

const emptyRow = () => ({ key: Math.random().toString(36).slice(2), classId: '', maxMarks: '100' })
const emptyForm = () => ({ title: '', description: '', startDate: '', endDate: '', classRows: [emptyRow()] })

const fromExam = (exam) => ({
  title: exam.title || '',
  description: exam.description || '',
  startDate: toDateInput(exam.startDate),
  endDate: toDateInput(exam.endDate),
  classRows: [],
})

/** Create (with class + max-marks rows) or edit (title, description, dates only). */
export default function ExamFormModal({ open, onClose, exam, classes, onSaved }) {
  const isEdit = !!exam
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setForm(exam ? fromExam(exam) : emptyForm())
    setErrors({})
    setServerError('')
  }, [open, exam])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const setRow = (index, key, value) =>
    setForm((f) => ({ ...f, classRows: f.classRows.map((r, i) => (i === index ? { ...r, [key]: value } : r)) }))
  const addRow = () => setForm((f) => ({ ...f, classRows: [...f.classRows, emptyRow()] }))
  const removeRow = (index) => setForm((f) => ({ ...f, classRows: f.classRows.filter((_, i) => i !== index) }))

  const usedClassIds = new Set(form.classRows.map((r) => r.classId).filter(Boolean))
  const canAddRow = form.classRows.length < classes.length

  const buildPayload = () => {
    const values = {
      title: form.title.trim(),
      description: form.description.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
    }

    if (!isEdit) {
      const body = { title: values.title }
      if (values.description) body.description = values.description
      if (values.startDate) body.startDate = values.startDate
      if (values.endDate) body.endDate = values.endDate
      body.classes = form.classRows.map((r) => ({ classId: r.classId, maxMarks: Number(r.maxMarks) }))
      return body
    }

    // PATCH only changed fields; cleared optional fields are sent as null.
    const original = fromExam(exam)
    const body = {}
    Object.entries(values).forEach(([key, value]) => {
      if (value !== original[key].trim()) body[key] = value === '' && key !== 'title' ? null : value
    })
    return body
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validationErrors = validateExamForm(form, { isEdit })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const body = buildPayload()
    if (isEdit && Object.keys(body).length === 0) {
      onClose()
      return
    }

    setSubmitting(true)
    try {
      const saved = isEdit ? await examsApi.update(exam.id, body) : await examsApi.create(body)
      onSaved(saved, { isEdit })
      onClose()
    } catch (err) {
      const message = getErrorMessage(err, isEdit ? 'Could not update the exam.' : 'Could not create the exam.')
      setServerError(getErrorCode(err) === 'EXAM_SCHEDULE_OUTSIDE_RANGE' ? `${message} Move those papers on the Date Sheet tab first.` : message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={isEdit ? 'Edit exam' : 'New exam'}
      subtitle={isEdit ? exam?.title : 'Create an exam and choose which classes take it'}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" required error={errors.title}>
          <input className={inputClass} value={form.title} onChange={set('title')} placeholder="Mid-term examination" autoFocus />
        </Field>

        <Field label="Description" error={errors.description} hint="Optional">
          <textarea rows={3} className={inputClass} value={form.description} onChange={set('description')} placeholder="Syllabus, instructions…" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start date" error={errors.startDate} hint="Optional">
            <input type="date" className={inputClass} value={form.startDate} onChange={set('startDate')} />
          </Field>
          <Field label="End date" error={errors.endDate} hint="Optional">
            <input type="date" className={inputClass} value={form.endDate} min={form.startDate || undefined} onChange={set('endDate')} />
          </Field>
        </div>

        {!isEdit && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-sm font-semibold text-ink/80">
                Classes <span className="text-coral">*</span>
              </span>
              <Button variant="ghost" size="sm" icon={Plus} onClick={addRow} disabled={!canAddRow}>
                Add class
              </Button>
            </div>
            <div className="space-y-3">
              {form.classRows.map((row, index) => {
                const rowErrors = errors.classRows?.[index] ?? {}
                return (
                  <div key={row.key} className="flex items-start gap-2">
                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2 flex-1 min-w-0">
                      <Field label={`Class ${index + 1}`} error={rowErrors.classId}>
                        <select className={selectClass} value={row.classId} onChange={(e) => setRow(index, 'classId', e.target.value)}>
                          <option value="">Select a class</option>
                          {classes
                            .filter((c) => c.id === row.classId || !usedClassIds.has(c.id))
                            .map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                      </Field>
                      <Field label="Max marks" error={rowErrors.maxMarks}>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          inputMode="decimal"
                          className={inputClass}
                          value={row.maxMarks}
                          onChange={(e) => setRow(index, 'maxMarks', e.target.value)}
                        />
                      </Field>
                    </div>
                    <IconButton
                      icon={X}
                      label={`Remove class row ${index + 1}`}
                      className="mt-9"
                      onClick={() => removeRow(index)}
                      disabled={form.classRows.length === 1}
                    />
                  </div>
                )
              })}
            </div>
            {errors.classes && <p className="text-xs text-coral mt-1 font-medium">{errors.classes}</p>}
            {classes.length === 0 && <p className="text-xs text-ink/50 mt-1">No classes exist yet — create classes first.</p>}
          </div>
        )}

        {isEdit && (
          <p className="text-xs text-ink/50">Classes are managed from the exam's detail page.</p>
        )}

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Create exam'} />
      </form>
    </Modal>
  )
}
