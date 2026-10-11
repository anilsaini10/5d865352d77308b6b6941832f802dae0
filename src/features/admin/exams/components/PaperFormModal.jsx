import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Lock } from 'lucide-react'
import { Modal, Field, inputClass, selectClass, Alert, FormActions } from '../../../../components/ui.jsx'
import { examsApi } from '../exams.api.js'
import TeacherSelect from './TeacherSelect.jsx'
import { describeConflict, examRange, paperError, validatePaperFields } from './scheduleUtils.js'

const empty = () => ({ classId: '', subjectId: '', date: '', startTime: '', endTime: '', maxMarks: '', roomNo: '', invigilator: null })

const fromPaper = (p) => ({
  classId: p.classId,
  subjectId: p.subjectId,
  date: p.date,
  startTime: p.startTime,
  endTime: p.endTime,
  maxMarks: String(p.maxMarks),
  roomNo: p.roomNo ?? '',
  invigilator: p.invigilator ? { id: p.invigilator.id, name: p.invigilator.name } : null,
})

function ConflictCard({ conflict, onEditExisting }) {
  if (!conflict) return null
  return (
    <div className="flex items-start gap-2 rounded-lg border border-coral/25 bg-coral/8 px-3 py-2 text-xs text-coral">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-semibold">Clashes with {describeConflict(conflict)}</p>
        {onEditExisting && conflict.scheduleId && (
          <button type="button" className="underline font-semibold mt-1" onClick={() => onEditExisting(conflict.scheduleId)}>
            Edit the existing paper instead
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Add / edit one paper. `examClasses` = the exam's classes ({ classId, className, maxMarks });
 * `classes` = /classes (for each class's subjects); `papers` = every paper in the exam.
 */
export default function PaperFormModal({ open, onClose, examId, exam, examClasses, classes, papers, paper, onSaved, onStale, onEditExisting }) {
  const isEdit = !!paper
  const locked = isEdit && (paper.markedCount ?? 0) > 0
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [conflict, setConflict] = useState(null)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setForm(paper ? fromPaper(paper) : empty())
    setErrors({})
    setConflict(null)
    setServerError('')
  }, [open, paper])

  const range = examRange(exam)
  const subjects = useMemo(() => {
    const cls = classes.find((c) => c.id === form.classId)
    const taken = new Set(papers.filter((p) => p.classId === form.classId && p.id !== paper?.id).map((p) => p.subjectId))
    return (cls?.subjects ?? []).filter((s) => !taken.has(s.id))
  }, [classes, papers, paper, form.classId])
  const classHasSubjects = (classes.find((c) => c.id === form.classId)?.subjects ?? []).length > 0

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined, ...(['date', 'startTime', 'endTime'].includes(key) && { time: undefined }) }))
    setConflict(null)
    setServerError('')
  }
  const onInput = (key) => (e) => set(key)(e.target.value)

  const onClassChange = (e) => {
    const classId = e.target.value
    const defaultMax = examClasses.find((c) => c.classId === classId)?.maxMarks
    setForm((f) => ({ ...f, classId, subjectId: '', maxMarks: !isEdit && defaultMax != null ? String(defaultMax) : f.maxMarks }))
    setErrors({})
    setConflict(null)
  }

  const buildPayload = () => {
    const room = form.roomNo.trim()
    const values = {
      classId: form.classId,
      subjectId: form.subjectId,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      maxMarks: Number(form.maxMarks),
      roomNo: room || null,
      invigilatorId: form.invigilator?.id ?? null,
    }
    if (!isEdit) {
      const body = { ...values }
      if (!room) delete body.roomNo
      if (!values.invigilatorId) delete body.invigilatorId
      return body
    }
    const before = { ...paper, roomNo: paper.roomNo ?? null, invigilatorId: paper.invigilator?.id ?? null }
    return Object.fromEntries(Object.entries(values).filter(([k, v]) => v !== before[k]))
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    setConflict(null)
    const v = validatePaperFields(form, exam)
    if (!form.classId) v.classId = 'Select a class.'
    if (!form.subjectId) v.subjectId = 'Select a subject.'
    setErrors(v)
    if (Object.keys(v).length > 0) return

    const body = buildPayload()
    if (isEdit && Object.keys(body).length === 0) {
      onClose()
      return
    }

    setSubmitting(true)
    try {
      const saved = isEdit ? await examsApi.updatePaper(examId, paper.id, body) : await examsApi.createPaper(examId, body)
      onSaved(saved, { isEdit })
      onClose()
    } catch (err) {
      const pe = paperError(err, isEdit ? 'Could not update the paper.' : 'Could not add the paper.')
      if (pe.field) setErrors({ [pe.field]: pe.message })
      else setServerError(pe.message)
      setConflict(pe.conflict)
      if (pe.code === 'EXAM_SCHEDULE_HAS_MARKS') onStale?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} wide title={isEdit ? 'Edit paper' : 'Add paper'} subtitle={exam?.title}>
      <form onSubmit={submit} className="space-y-4">
        {locked && (
          <Alert tone="warning">
            <span className="inline-flex items-center gap-1.5"><Lock size={13} /> Marks are already recorded for this paper, so class and subject are locked. Max marks can't go below the highest marks saved.</span>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Class" required error={errors.classId}>
            <select className={selectClass} value={form.classId} onChange={onClassChange} disabled={locked} autoFocus={!isEdit}>
              <option value="">Select a class</option>
              {examClasses.map((c) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
            </select>
          </Field>
          <div className="space-y-2">
            <Field
              label="Subject"
              required
              error={errors.subjectId}
              hint={form.classId && subjects.length === 0 ? (classHasSubjects ? 'Every subject of this class is already scheduled.' : 'This class has no subjects yet.') : undefined}
            >
              <select className={selectClass} value={form.subjectId} onChange={onInput('subjectId')} disabled={locked || !form.classId}>
                <option value="">{form.classId ? 'Select a subject' : 'Select a class first'}</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            {errors.subjectId && conflict?.scheduleId && <ConflictCard conflict={conflict} onEditExisting={onEditExisting && ((id) => { onClose(); onEditExisting(id) })} />}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Date" required error={errors.date} hint={range.min || range.max ? 'Within the exam dates' : undefined}>
            <input type="date" className={inputClass} value={form.date} min={range.min} max={range.max} onChange={onInput('date')} />
          </Field>
          <Field label="Start time" required error={errors.startTime}>
            <input type="time" className={inputClass} value={form.startTime} onChange={onInput('startTime')} />
          </Field>
          <Field label="End time" required error={errors.endTime}>
            <input type="time" className={inputClass} value={form.endTime} onChange={onInput('endTime')} />
          </Field>
        </div>
        {errors.time && (
          <div className="space-y-2">
            <p className="text-xs text-coral font-medium">{errors.time}</p>
            <ConflictCard conflict={conflict} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Max marks" required error={errors.maxMarks} hint={!isEdit ? 'Prefilled from the class’s exam max marks' : undefined}>
            <input type="number" min="1" step="any" inputMode="decimal" className={inputClass} value={form.maxMarks} onChange={onInput('maxMarks')} />
          </Field>
          <Field label="Room" error={errors.roomNo} hint="Optional">
            <input className={inputClass} value={form.roomNo} maxLength={50} placeholder="Hall 1" onChange={onInput('roomNo')} />
          </Field>
        </div>
        {errors.roomNo && <ConflictCard conflict={conflict} />}

        <div>
          <span className="text-sm font-semibold text-ink/80">Invigilator</span>
          <div className="mt-1.5"><TeacherSelect value={form.invigilator} onChange={set('invigilator')} invalid={!!errors.invigilatorId} /></div>
          {errors.invigilatorId ? <p className="text-xs text-coral mt-1 font-medium">{errors.invigilatorId}</p> : <p className="text-xs text-ink/45 mt-1">Optional. Teachers on approved leave that day or already invigilating at this time are rejected.</p>}
          {errors.invigilatorId && <div className="mt-2"><ConflictCard conflict={conflict} /></div>}
        </div>

        <Alert>{serverError}</Alert>
        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Add paper'} />
      </form>
    </Modal>
  )
}
