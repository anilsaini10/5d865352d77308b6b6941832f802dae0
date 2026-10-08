import { useEffect, useMemo, useState } from 'react'
import { UserMinus } from 'lucide-react'
import { Modal, Field, inputClass, selectClass, Alert, Button, FormActions, WarningNote } from '../../../../components/ui.jsx'
import { getErrorCode, getErrorMessage } from '../../../../api/httpClient.js'
import { useFetch } from '../../../../hooks/useFetch.js'
import { teachersApi } from '../../teachers/teachers.api.js'
import { classesApi } from '../classes.api.js'
import { validateSectionFields } from '../classes.validation.js'

const NO_TEACHER = ''

/**
 * Add a section to `schoolClass`, or edit `section` (name, capacity and class
 * teacher). `classes` is the full class list, used to flag teachers who are
 * already class teacher of another section.
 */
export default function SectionFormModal({ open, onClose, schoolClass, section, classes, onSaved }) {
  const isEdit = !!section
  const [form, setForm] = useState({ name: '', capacity: '', classTeacherId: NO_TEACHER })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: teachers, loading: teachersLoading, error: teachersError } = useFetch(
    () => teachersApi.listAll(),
    [open],
    { enabled: open && isEdit, errorMessage: 'Could not load teachers.' }
  )

  useEffect(() => {
    if (open) {
      setForm(
        section
          ? { name: section.name, capacity: String(section.capacity), classTeacherId: section.classTeacherId ?? NO_TEACHER }
          : { name: '', capacity: '40', classTeacherId: NO_TEACHER }
      )
    }
    setErrors({})
    setServerError('')
  }, [open, section])

  // teacherId → "Class 5 – B" for every OTHER section that already has a class teacher.
  const assignedElsewhere = useMemo(() => {
    const map = new Map()
    for (const c of classes ?? []) {
      for (const s of c.sections ?? []) {
        if (s.classTeacherId && s.id !== section?.id) map.set(s.classTeacherId, `${c.name} – ${s.name}`)
      }
    }
    return map
  }, [classes, section])

  const teacherOptions = useMemo(() => {
    const list = [...(teachers ?? [])].sort((a, b) => a.name.localeCompare(b.name))
    // Keep the current class teacher selectable even if they're not in the active list.
    if (section?.classTeacherId && !list.some((t) => t.id === section.classTeacherId)) {
      list.unshift({ id: section.classTeacherId, name: section.classTeacherName ?? 'Current teacher' })
    }
    return list
  }, [teachers, section])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const selectedElsewhere = form.classTeacherId ? assignedElsewhere.get(form.classTeacherId) : null

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateSectionFields(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const name = form.name.trim()
    const capacity = Number(form.capacity)

    setSubmitting(true)
    try {
      if (isEdit) {
        const body = {}
        if (name !== section.name) body.name = name
        if (capacity !== section.capacity) body.capacity = capacity
        const currentTeacher = section.classTeacherId ?? NO_TEACHER
        if (form.classTeacherId !== currentTeacher) body.classTeacherId = form.classTeacherId || null
        if (Object.keys(body).length > 0) {
          await classesApi.updateSection(schoolClass.id, section.id, body)
          onSaved({ isEdit: true, name })
        }
      } else {
        await classesApi.addSection(schoolClass.id, { name, capacity })
        onSaved({ isEdit: false, name })
      }
      onClose()
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'SECTION_NAME_TAKEN') {
        setErrors({ name: `${schoolClass.name} already has a section with this name.` })
      } else if (code === 'TEACHER_ALREADY_CLASS_TEACHER') {
        setErrors({
          classTeacherId:
            'This teacher is already class teacher of another section. Remove them from that section first — a teacher can be class teacher of only one section.',
        })
      } else {
        setServerError(getErrorMessage(err, isEdit ? 'Could not update section.' : 'Could not add section.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit section' : 'Add section'}
      subtitle={isEdit ? `${schoolClass?.name} – ${section?.name}` : schoolClass?.name}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Section name" required error={errors.name}>
            <input className={inputClass} value={form.name} onChange={set('name')} placeholder="B" autoFocus />
          </Field>
          <Field
            label="Capacity"
            required
            error={errors.capacity}
            hint={isEdit ? `${section.studentCount} active students` : undefined}
          >
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className={inputClass}
              value={form.capacity}
              onChange={set('capacity')}
            />
          </Field>
        </div>

        {isEdit && (
          <div className="space-y-2">
            <Field
              label="Class teacher"
              error={errors.classTeacherId || teachersError}
              hint="A teacher can be class teacher of only one section."
            >
              <select
                className={selectClass}
                value={form.classTeacherId}
                onChange={set('classTeacherId')}
                disabled={teachersLoading}
              >
                <option value={NO_TEACHER}>{teachersLoading ? 'Loading teachers…' : 'No class teacher'}</option>
                {teacherOptions.map((t) => {
                  const elsewhere = assignedElsewhere.get(t.id)
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.employeeId ? ` (${t.employeeId})` : ''}
                      {elsewhere ? ` — class teacher of ${elsewhere}` : ''}
                    </option>
                  )
                })}
              </select>
            </Field>
            {selectedElsewhere && !errors.classTeacherId && (
              <WarningNote>
                This teacher is already class teacher of {selectedElsewhere}. Saving will fail unless they are removed from
                that section first.
              </WarningNote>
            )}
            {form.classTeacherId && (
              <Button variant="secondary" size="sm" icon={UserMinus} onClick={() => setForm((f) => ({ ...f, classTeacherId: NO_TEACHER }))}>
                Remove class teacher
              </Button>
            )}
          </div>
        )}

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Add section'} />
      </form>
    </Modal>
  )
}
