import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Modal, Field, inputClass, Alert, Button, IconButton, FormActions } from '../../../../components/ui.jsx'
import { getErrorCode, getErrorMessage } from '../../../../api/httpClient.js'
import { classesApi } from '../classes.api.js'
import { validateClassFields, validateCreateClassForm } from '../classes.validation.js'

const newSectionRow = (name = '') => ({ key: Math.random().toString(36).slice(2), name, capacity: '40' })

const emptyForm = () => ({ name: '', numericLevel: '', sections: [newSectionRow('A')] })

/** Create a class with its initial sections, or (with `schoolClass`) edit its name / level. */
export default function ClassFormModal({ open, onClose, schoolClass, onSaved }) {
  const isEdit = !!schoolClass
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        schoolClass
          ? { name: schoolClass.name, numericLevel: String(schoolClass.numericLevel), sections: [] }
          : emptyForm()
      )
    }
    setErrors({})
    setServerError('')
  }, [open, schoolClass])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const setSection = (index, key) => (e) =>
    setForm((f) => ({ ...f, sections: f.sections.map((s, i) => (i === index ? { ...s, [key]: e.target.value } : s)) }))

  const addSectionRow = () =>
    setForm((f) => {
      // Suggest the next letter after the last section (A → B → C ...).
      const last = f.sections[f.sections.length - 1]?.name.trim()
      const next = /^[A-Y]$/i.test(last ?? '') ? String.fromCharCode(last.toUpperCase().charCodeAt(0) + 1) : ''
      return { ...f, sections: [...f.sections, newSectionRow(next)] }
    })

  const removeSectionRow = (index) => setForm((f) => ({ ...f, sections: f.sections.filter((_, i) => i !== index) }))

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = isEdit ? validateClassFields(form) : validateCreateClassForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const name = form.name.trim()
    const numericLevel = Number(form.numericLevel)

    setSubmitting(true)
    try {
      if (isEdit) {
        const body = {}
        if (name !== schoolClass.name) body.name = name
        if (numericLevel !== schoolClass.numericLevel) body.numericLevel = numericLevel
        if (Object.keys(body).length > 0) {
          await classesApi.update(schoolClass.id, body)
          onSaved({ isEdit: true, name })
        }
      } else {
        await classesApi.create({
          name,
          numericLevel,
          sections: form.sections.map((s) => ({ name: s.name.trim(), capacity: Number(s.capacity) })),
        })
        onSaved({ isEdit: false, name })
      }
      onClose()
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'CLASS_NAME_TAKEN') {
        setErrors({ name: 'A class with this name already exists.' })
      } else if (code === 'SECTION_NAME_TAKEN') {
        setServerError('Section names must be unique within the class.')
      } else {
        setServerError(getErrorMessage(err, isEdit ? 'Could not update class.' : 'Could not create class.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit class' : 'Create class'}
      subtitle={isEdit ? schoolClass?.name : 'Add a class with its sections'}
      wide={!isEdit}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Class name" required error={errors.name}>
            <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Class 5" autoFocus />
          </Field>
          <Field label="Numeric level" required error={errors.numericLevel} hint="Used to sort classes, e.g. 5 for Class 5">
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              className={inputClass}
              value={form.numericLevel}
              onChange={set('numericLevel')}
              placeholder="5"
            />
          </Field>
        </div>

        {!isEdit && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-ink/80">
                Sections <span className="text-coral">*</span>
              </span>
              <Button variant="secondary" size="sm" icon={Plus} onClick={addSectionRow}>
                Add section
              </Button>
            </div>
            <div className="space-y-3">
              {form.sections.map((s, i) => {
                const rowErrors = errors.sections?.[i] ?? {}
                return (
                  <div key={s.key} className="flex items-start gap-2 sm:gap-3 bg-paper border border-line rounded-xl p-3">
                    <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
                      <Field label="Name" error={rowErrors.name}>
                        <input className={inputClass} value={s.name} onChange={setSection(i, 'name')} placeholder="A" />
                      </Field>
                      <Field label="Capacity" error={rowErrors.capacity}>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          className={inputClass}
                          value={s.capacity}
                          onChange={setSection(i, 'capacity')}
                        />
                      </Field>
                    </div>
                    <IconButton
                      icon={Trash2}
                      tone="danger"
                      label={`Remove section row ${s.name || i + 1}`}
                      onClick={() => removeSectionRow(i)}
                      disabled={form.sections.length === 1}
                      className="mt-8 disabled:opacity-30 disabled:pointer-events-none"
                    />
                  </div>
                )
              })}
            </div>
            {errors.sectionsGeneral && <p className="text-xs text-coral mt-1 font-medium">{errors.sectionsGeneral}</p>}
          </div>
        )}

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Create class'} />
      </form>
    </Modal>
  )
}
