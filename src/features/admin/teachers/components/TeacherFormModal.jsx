import { useEffect, useMemo, useState } from 'react'
import { Modal, Field, inputClass, selectClass, Alert, FormActions } from '../../../../components/ui.jsx'
import { getErrorMessage, getErrorCode } from '../../../../api/httpClient.js'
import { toDateInput, todayInput } from '../../../../utils/format.js'
import { GENDERS } from '../../constants.js'
import { teachersApi } from '../teachers.api.js'
import { validateTeacherForm } from '../teachers.validation.js'
import ExpertiseInput from './ExpertiseInput.jsx'

const emptyForm = {
  name: '',
  email: '',
  username: '',
  phone: '',
  gender: '',
  salary: '',
  qualification: '',
  experienceYears: '0',
  experienceMonths: '0',
  subjects: [],
  joiningDate: todayInput(),
  classTeacherSectionId: '',
}

function formFromTeacher(t) {
  return {
    name: t.name ?? '',
    email: t.email ?? '',
    username: t.username ?? '',
    phone: t.phone ?? '',
    gender: t.gender ?? '',
    salary: t.salary != null ? String(t.salary) : '',
    qualification: t.qualification ?? '',
    experienceYears: String(t.experienceYears ?? 0),
    experienceMonths: String(t.experienceMonths ?? 0),
    subjects: t.subjectsTaught ?? [],
    joiningDate: toDateInput(t.joiningDate),
    classTeacherSectionId: t.classTeacherOf?.[0]?.sectionId ?? '',
  }
}

/**
 * Create / edit a teacher. `classes` comes from useClasses (sections carry
 * classTeacherId/Name), `subjectNames` feeds the expertise suggestions.
 * onSaved(result, { isEdit }) — result is { teacher, defaultPassword } on create.
 */
export default function TeacherFormModal({ open, onClose, teacher, classes = [], subjectNames = [], onSaved }) {
  const isEdit = !!teacher
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setForm(teacher ? formFromTeacher(teacher) : { ...emptyForm, joiningDate: todayInput() })
    setErrors({})
    setServerError('')
  }, [open, teacher])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const classesWithSections = useMemo(() => classes.filter((c) => c.sections?.length), [classes])

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validationErrors = validateTeacherForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) return

    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      username: form.username.trim().toLowerCase() || (isEdit ? null : undefined),
      gender: form.gender,
      salary: Number(form.salary),
      qualification: form.qualification.trim(),
      experienceYears: Number(form.experienceYears),
      experienceMonths: Number(form.experienceMonths),
      joiningDate: form.joiningDate,
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        body.subjectsTaught = form.subjects
        const original = teacher.classTeacherOf?.[0]?.sectionId ?? ''
        if (form.classTeacherSectionId !== original) body.classTeacherSectionId = form.classTeacherSectionId || null
        const result = await teachersApi.update(teacher.id, body)
        onSaved({ teacher: result?.teacher ?? result }, { isEdit: true })
      } else {
        body.subjects = form.subjects
        if (form.classTeacherSectionId) body.classTeacherSectionId = form.classTeacherSectionId
        const result = await teachersApi.create(body)
        onSaved(result, { isEdit: false })
      }
      onClose()
    } catch (err) {
      const code = getErrorCode(err)
      const message = getErrorMessage(err, isEdit ? 'Could not update teacher.' : 'Could not create teacher.')
      if (code === 'EMAIL_TAKEN') setErrors((p) => ({ ...p, email: 'This email is already in use.' }))
      else if (code === 'USERNAME_TAKEN') setErrors((p) => ({ ...p, username: 'This username is already taken.' }))
      else if (code === 'VALIDATION_ERROR' && message.startsWith('username:')) setErrors((p) => ({ ...p, username: message.replace(/^username:\s*/, '') }))
      else if (code === 'SECTION_ALREADY_HAS_CLASS_TEACHER') {
        setErrors((p) => ({ ...p, classTeacherSectionId: 'This section already has a class teacher.' }))
      } else setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={isEdit ? 'Edit teacher' : 'Add teacher'}
      subtitle={isEdit ? teacher?.name : 'The teacher logs in with their email and a default password'}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" required error={errors.name}>
            <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Anita Sharma" autoFocus />
          </Field>
          <Field label="Email" required error={errors.email} hint="Used as the login ID">
            <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="anita@school.edu" />
          </Field>
          <Field label="Username" error={errors.username} hint="Optional · Saved in lowercase">
            <input
              className={inputClass}
              value={form.username}
              onChange={set('username')}
              onBlur={() => setForm((f) => ({ ...f, username: f.username.trim().toLowerCase() }))}
              placeholder="anita.teacher"
            />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <input inputMode="numeric" className={inputClass} value={form.phone} onChange={set('phone')} placeholder="9876543210" />
          </Field>
          <Field label="Gender" required error={errors.gender}>
            <select className={selectClass} value={form.gender} onChange={set('gender')}>
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Monthly salary (₹)" required error={errors.salary}>
            <input type="number" min="1" className={inputClass} value={form.salary} onChange={set('salary')} placeholder="45000" />
          </Field>
          <Field label="Joining date" required error={errors.joiningDate}>
            <input type="date" className={inputClass} value={form.joiningDate} onChange={set('joiningDate')} />
          </Field>
          <Field label="Qualification" required error={errors.qualification}>
            <input className={inputClass} value={form.qualification} onChange={set('qualification')} placeholder="M.Sc, B.Ed" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Experience (yrs)" required error={errors.experienceYears}>
              <input type="number" min="0" step="1" className={inputClass} value={form.experienceYears} onChange={set('experienceYears')} />
            </Field>
            <Field label="Months" required error={errors.experienceMonths}>
              <input type="number" min="0" max="11" step="1" className={inputClass} value={form.experienceMonths} onChange={set('experienceMonths')} />
            </Field>
          </div>
        </div>

        <Field
          label="Subject expertise"
          required
          error={errors.subjects}
          hint="General subjects this teacher can teach. Class-specific assignments are managed on the teacher's page."
        >
          <ExpertiseInput value={form.subjects} onChange={(subjects) => setForm((f) => ({ ...f, subjects }))} suggestions={subjectNames} />
        </Field>

        <Field
          label="Class teacher of"
          error={errors.classTeacherSectionId}
          hint="Sections that already have a class teacher are shown with their name and can't be picked."
        >
          <select className={selectClass} value={form.classTeacherSectionId} onChange={set('classTeacherSectionId')}>
            <option value="">None</option>
            {classesWithSections.map((c) => (
              <optgroup key={c.id} label={c.name}>
                {c.sections.map((s) => {
                  const takenByOther = s.classTeacherId && s.classTeacherId !== teacher?.id
                  return (
                    <option key={s.id} value={s.id} disabled={takenByOther}>
                      {c.name} – {s.name}
                      {s.classTeacherId ? ` (class teacher: ${s.classTeacherId === teacher?.id ? 'this teacher' : s.classTeacherName || 'assigned'})` : ''}
                    </option>
                  )
                })}
              </optgroup>
            ))}
          </select>
        </Field>

        <Alert>{serverError}</Alert>
        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Create teacher'} />
      </form>
    </Modal>
  )
}
