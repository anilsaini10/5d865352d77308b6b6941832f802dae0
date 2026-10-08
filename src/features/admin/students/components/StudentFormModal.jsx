import { useEffect, useState } from 'react'
import { Modal, Field, inputClass, selectClass, Alert, Button, FormActions, WarningNote } from '../../../../components/ui.jsx'
import { getErrorMessage, getErrorCode } from '../../../../api/httpClient.js'
import { todayInput } from '../../../../utils/format.js'
import { BLOOD_GROUPS, GENDERS } from '../../constants.js'
import { studentsApi, parseSuggestedRollNo } from '../students.api.js'
import { emptyStudentForm, studentToForm, studentFormToPayload, validateStudentForm } from '../students.validation.js'

const PARENT_TAKEN_MESSAGE = 'Email or phone number already registered to a different account.'

function FormSection({ title, description, children }) {
  return (
    <fieldset className="border border-line rounded-xl p-4">
      <legend className="px-1.5 font-display font-semibold text-ink">{title}</legend>
      {description && <p className="text-xs text-ink/50 -mt-1 mb-3">{description}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </fieldset>
  )
}

/** Fields whose value differs from the original; class + section always travel together. */
function changedFields(original, current) {
  const changes = {}
  for (const key of Object.keys(current)) {
    if (current[key] !== original[key]) changes[key] = current[key] ?? null
  }
  if ('classId' in changes || 'sectionId' in changes) {
    changes.classId = current.classId
    changes.sectionId = current.sectionId
  }
  return changes
}

/**
 * Create / edit a student. `restore` ({ message, suggestedRollNo }) puts the
 * modal in "fix roll number and reactivate" mode, used when restoring a
 * soft-deleted student whose old roll number has since been taken.
 */
export default function StudentFormModal({ open, onClose, student, restore, classes, sectionsOf, onSaved }) {
  const isEdit = !!student
  const [form, setForm] = useState(emptyStudentForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [suggestedRollNo, setSuggestedRollNo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(student ? studentToForm(student) : emptyStudentForm)
      setSuggestedRollNo(restore?.suggestedRollNo ?? null)
      setErrors(restore ? { rollNo: 'This roll number is now taken — choose another.' } : {})
    } else {
      setErrors({})
    }
    setServerError('')
  }, [open, student, restore])

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (key === 'rollNo') setSuggestedRollNo(null)
  }

  const changeClass = (e) => {
    const classId = e.target.value
    setForm((f) => ({ ...f, classId, sectionId: '' }))
    setErrors((prev) => ({ ...prev, classId: undefined, sectionId: undefined }))
  }

  const applySuggestedRoll = () => {
    setForm((f) => ({ ...f, rollNo: String(suggestedRollNo) }))
    setErrors((prev) => ({ ...prev, rollNo: undefined }))
    setSuggestedRollNo(null)
  }

  const handleError = (err) => {
    const message = getErrorMessage(err, isEdit ? 'Could not update student.' : 'Could not add student.')
    const code = getErrorCode(err)
    if (code === 'ROLL_NO_TAKEN') {
      setErrors((prev) => ({ ...prev, rollNo: message }))
      setSuggestedRollNo(parseSuggestedRollNo(message))
    } else if (code === 'EMAIL_TAKEN') {
      setErrors((prev) => ({ ...prev, parentEmail: PARENT_TAKEN_MESSAGE, parentPhone: PARENT_TAKEN_MESSAGE }))
    } else {
      setServerError(message)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateStudentForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const payload = studentFormToPayload(form)
    setSubmitting(true)
    try {
      if (isEdit) {
        const changes = changedFields(studentFormToPayload(studentToForm(student)), payload)
        if (restore) changes.status = 'ACTIVE'
        if (Object.keys(changes).length === 0) {
          onClose()
          return
        }
        const updated = await studentsApi.update(student.id, changes)
        onSaved({ student: updated }, { isEdit: true, restored: !!restore })
      } else {
        const result = await studentsApi.create(payload)
        onSaved(result, { isEdit: false })
      }
      onClose()
    } catch (err) {
      handleError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const sections = form.classId ? sectionsOf(form.classId) : []

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide="xl"
      title={restore ? 'Restore student' : isEdit ? 'Edit student' : 'Add student'}
      subtitle={isEdit ? `${student.name} · ${student.admissionNo}` : 'A parent login is created (or linked) automatically'}
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {restore && (
          <WarningNote>
            {restore.message || 'The previous roll number has been given to another student.'} Pick a new roll number, then save to restore.
          </WarningNote>
        )}

        <FormSection title="Student details">
          <div className="sm:col-span-2">
            <Field label="Full name" required error={errors.name}>
              <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Aarav Sharma" autoFocus={!restore} />
            </Field>
          </div>
          <Field label="Gender" required error={errors.gender}>
            <select className={selectClass} value={form.gender} onChange={set('gender')}>
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Date of birth" required error={errors.dateOfBirth}>
            <input type="date" className={inputClass} value={form.dateOfBirth} onChange={set('dateOfBirth')} max={todayInput()} />
          </Field>
        </FormSection>

        <FormSection title="Class placement" description="Roll numbers are unique within a section.">
          <Field label="Class" required error={errors.classId}>
            <select className={selectClass} value={form.classId} onChange={changeClass}>
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Section" required error={errors.sectionId} hint={!form.classId ? 'Choose a class first' : undefined}>
            <select className={selectClass} value={form.sectionId} onChange={set('sectionId')} disabled={!form.classId}>
              <option value="">{form.classId && sections.length === 0 ? 'No sections in this class' : 'Select section'}</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <div>
            <Field label="Roll number" required error={errors.rollNo}>
              <input type="number" min="1" step="1" inputMode="numeric" className={inputClass} value={form.rollNo} onChange={set('rollNo')} placeholder="1" autoFocus={!!restore} />
            </Field>
            {suggestedRollNo != null && (
              <Button size="sm" variant="secondary" className="mt-2" onClick={applySuggestedRoll}>
                Use {suggestedRollNo}
              </Button>
            )}
          </div>
        </FormSection>

        <FormSection
          title="Parent"
          description="If this email or phone already belongs to a parent account, the student is linked to it."
        >
          <div className="sm:col-span-2">
            <Field label="Parent name" required error={errors.parentName}>
              <input className={inputClass} value={form.parentName} onChange={set('parentName')} placeholder="Rakesh Sharma" />
            </Field>
          </div>
          <Field label="Parent phone" required error={errors.parentPhone} hint="10-15 digits">
            <input type="tel" className={inputClass} value={form.parentPhone} onChange={set('parentPhone')} placeholder="9876543210" />
          </Field>
          <Field label="Parent email" required error={errors.parentEmail} hint="Used as the parent's login">
            <input type="email" className={inputClass} value={form.parentEmail} onChange={set('parentEmail')} placeholder="parent@example.com" />
          </Field>
        </FormSection>

        <FormSection title="Other">
          <Field label="Blood group" error={errors.bloodGroup}>
            <select className={selectClass} value={form.bloodGroup} onChange={set('bloodGroup')}>
              <option value="">Not specified</option>
              {BLOOD_GROUPS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" error={errors.address}>
              <textarea rows={2} className={inputClass} value={form.address} onChange={set('address')} placeholder="House no., street, city" />
            </Field>
          </div>
        </FormSection>

        <Alert>{serverError}</Alert>

        <FormActions
          onCancel={onClose}
          submitting={submitting}
          submitLabel={restore ? 'Save & restore' : isEdit ? 'Save changes' : 'Add student'}
        />
      </form>
    </Modal>
  )
}
