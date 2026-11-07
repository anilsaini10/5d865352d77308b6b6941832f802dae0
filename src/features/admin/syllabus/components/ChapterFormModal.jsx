import { useEffect, useState } from 'react'
import { Modal, Field, inputClass, selectClass, Alert, FormActions } from '../../../../components/ui.jsx'
import { getErrorMessage, getErrorCode } from '../../../../api/httpClient.js'
import { chaptersApi } from '../syllabus.api.js'
import { subjectsApi } from '../../subjects/subjects.api.js'
import { emptyChapterForm, chapterToForm, chapterFormToPayload, validateChapterForm } from '../syllabus.validation.js'

export default function ChapterFormModal({ open, onClose, chapter, classes, onSaved }) {
  const isEdit = !!chapter

  const [form, setForm] = useState(emptyChapterForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  useEffect(() => {
    if (open) setForm(chapter ? chapterToForm(chapter) : emptyChapterForm)
    setErrors({})
    setServerError('')
  }, [open, chapter])

  // Load subjects when classId changes
  useEffect(() => {
    if (!form.classId) {
      setSubjects([])
      return
    }
    let cancelled = false
    setLoadingSubjects(true)
    subjectsApi.byClass(form.classId)
      .then((data) => { if (!cancelled) setSubjects(data ?? []) })
      .catch(() => { if (!cancelled) setSubjects([]) })
      .finally(() => { if (!cancelled) setLoadingSubjects(false) })
    return () => { cancelled = true }
  }, [form.classId])

  const set = (key) => (e) => {
    const value = e.target.value
    if (key === 'classId') {
      setForm((f) => ({ ...f, classId: value, subjectId: '' }))
    } else {
      setForm((f) => ({ ...f, [key]: value }))
    }
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateChapterForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const payload = chapterFormToPayload(form)
    setSubmitting(true)
    try {
      if (isEdit) {
        const { subjectId, classId, ...updatePayload } = payload
        const updated = await chaptersApi.update(chapter.id, updatePayload)
        onSaved(updated, { isEdit: true })
      } else {
        const created = await chaptersApi.create(payload)
        onSaved(created, { isEdit: false })
      }
      onClose()
    } catch (err) {
      const message = getErrorMessage(err, isEdit ? 'Could not update chapter.' : 'Could not create chapter.')
      const code = getErrorCode(err)
      if (code === 'CHAPTER_NUMBER_EXISTS') setErrors((prev) => ({ ...prev, chapterNumber: message }))
      else if (code === 'SUBJECT_CLASS_MISMATCH') setServerError('This subject is not assigned to the selected class.')
      else setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const sortedClasses = [...(classes ?? [])].sort((a, b) => a.numericLevel - b.numericLevel)

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={isEdit ? 'Edit chapter' : 'Add chapter'}
      subtitle={isEdit ? `${chapter.name} · Ch. ${chapter.chapterNumber}` : 'Create a new chapter for a subject'}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Class" required error={errors.classId}>
            <select className={selectClass} value={form.classId} onChange={set('classId')} disabled={isEdit}>
              <option value="">Select class</option>
              {sortedClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Subject" required error={errors.subjectId}>
            <select className={selectClass} value={form.subjectId} onChange={set('subjectId')} disabled={isEdit || !form.classId}>
              <option value="">{loadingSubjects ? 'Loading…' : form.classId ? 'Select subject' : 'Select a class first'}</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Chapter name" required error={errors.name}>
              <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Introduction to Physics" autoFocus />
            </Field>
          </div>

          <Field label="Chapter number" required error={errors.chapterNumber}>
            <input type="number" min="1" step="1" inputMode="numeric" className={inputClass} value={form.chapterNumber} onChange={set('chapterNumber')} placeholder="1" />
          </Field>

          <Field label="Sequence number" required error={errors.sequenceNumber}>
            <input type="number" min="1" step="1" inputMode="numeric" className={inputClass} value={form.sequenceNumber} onChange={set('sequenceNumber')} placeholder="1" />
          </Field>

          <Field label="Expected working days" error={errors.expectedWorkingDays}>
            <input type="number" min="0" step="1" inputMode="numeric" className={inputClass} value={form.expectedWorkingDays} onChange={set('expectedWorkingDays')} placeholder="5" />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Description" error={errors.description}>
              <textarea className={`${inputClass} min-h-[80px]`} value={form.description} onChange={set('description')} placeholder="Optional description..." rows={3} />
            </Field>
          </div>
        </div>

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Add chapter'} />
      </form>
    </Modal>
  )
}
