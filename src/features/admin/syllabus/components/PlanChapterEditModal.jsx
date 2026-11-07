import { useState, useEffect } from 'react'
import { Modal, Field, inputClass, FormActions } from '../../../../components/ui.jsx'
import { useToast } from '../../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { plansApi } from '../syllabus.api.js'

export default function PlanChapterEditModal({ open, onClose, planId, chapter, onSaved }) {
  const { notify } = useToast()
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && chapter) {
      setForm({
        expectedWorkingDays: chapter.expectedWorkingDays != null ? String(chapter.expectedWorkingDays) : '0',
        plannedStartDate: chapter.plannedStartDate ? String(chapter.plannedStartDate).slice(0, 10) : '',
        plannedEndDate: chapter.plannedEndDate ? String(chapter.plannedEndDate).slice(0, 10) : '',
        adminRemarks: chapter.adminRemarks ?? '',
        sequenceNumber: chapter.sequenceNumber != null ? String(chapter.sequenceNumber) : '',
      })
      setErrors({})
    }
  }, [open, chapter])

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const errs = {}
    const days = Number(form.expectedWorkingDays)
    if (form.expectedWorkingDays !== '' && (Number.isNaN(days) || days < 0)) errs.expectedWorkingDays = 'Must be 0 or more.'
    if (form.adminRemarks && form.adminRemarks.length > 500) errs.adminRemarks = 'Max 500 characters.'
    const seq = Number(form.sequenceNumber)
    if (form.sequenceNumber !== '' && (Number.isNaN(seq) || seq < 1)) errs.sequenceNumber = 'Must be at least 1.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const body = {}
    if (form.expectedWorkingDays !== '') body.expectedWorkingDays = Number(form.expectedWorkingDays)
    if (form.plannedStartDate) body.plannedStartDate = form.plannedStartDate
    if (form.plannedEndDate) body.plannedEndDate = form.plannedEndDate
    if (form.adminRemarks.trim()) body.adminRemarks = form.adminRemarks.trim()
    if (form.sequenceNumber !== '') body.sequenceNumber = Number(form.sequenceNumber)

    if (!Object.keys(body).length) { onClose(); return }

    setSubmitting(true)
    try {
      await plansApi.updateChapter(planId, chapter.chapterId, body)
      notify('Chapter updated.', 'success')
      onSaved?.()
      onClose()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not update chapter.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const chapterName = chapter?.chapter?.name ?? 'Chapter'

  return (
    <Modal open={open} onClose={onClose} title={`Edit — ${chapterName}`} subtitle="Update admin planning fields">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Expected Working Days" error={errors.expectedWorkingDays}>
            <input type="number" min="0" className={inputClass} value={form.expectedWorkingDays ?? ''} onChange={set('expectedWorkingDays')} />
          </Field>
          <Field label="Sequence Number" error={errors.sequenceNumber}>
            <input type="number" min="1" className={inputClass} value={form.sequenceNumber ?? ''} onChange={set('sequenceNumber')} />
          </Field>
          <Field label="Planned Start Date">
            <input type="date" className={inputClass} value={form.plannedStartDate ?? ''} onChange={set('plannedStartDate')} />
          </Field>
          <Field label="Planned End Date">
            <input type="date" className={inputClass} value={form.plannedEndDate ?? ''} onChange={set('plannedEndDate')} />
          </Field>
        </div>
        <Field label="Admin Remarks" error={errors.adminRemarks}>
          <textarea rows={3} maxLength={500} className={inputClass} value={form.adminRemarks ?? ''} onChange={set('adminRemarks')} placeholder="Optional notes..." />
        </Field>
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Save" />
      </form>
    </Modal>
  )
}
