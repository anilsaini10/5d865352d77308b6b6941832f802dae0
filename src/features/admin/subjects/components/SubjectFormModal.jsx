import { useEffect, useState } from 'react'
import { Modal, Field, inputClass, Alert, FormActions } from '../../../../components/ui.jsx'
import { getErrorCode, getErrorMessage } from '../../../../api/httpClient.js'
import { subjectsApi } from '../subjects.api.js'
import { validateSubjectForm } from '../subjects.validation.js'

/** Create a subject, optionally linking it to classes straight away. `classes` should be pre-sorted. */
export default function SubjectFormModal({ open, onClose, classes, classesLoading, onSaved }) {
  const [name, setName] = useState('')
  const [classIds, setClassIds] = useState([])
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setClassIds([])
    }
    setErrors({})
    setServerError('')
  }, [open])

  const toggleClass = (id) => setClassIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  const allSelected = classes.length > 0 && classIds.length === classes.length

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateSubjectForm({ name })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const body = { name: name.trim() }
    if (classIds.length > 0) body.classIds = classIds

    setSubmitting(true)
    try {
      const subject = await subjectsApi.create(body)
      onSaved(subject ?? body)
      onClose()
    } catch (err) {
      if (getErrorCode(err)?.endsWith('NAME_TAKEN')) {
        setErrors({ name: 'A subject with this name already exists.' })
      } else {
        setServerError(getErrorMessage(err, 'Could not create subject.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add subject" subtitle="Create a subject and optionally link it to classes">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Subject name" required error={errors.name}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mathematics" autoFocus />
        </Field>

        <fieldset>
          <div className="flex items-center justify-between">
            <legend className="text-sm font-semibold text-ink/80">Link to classes</legend>
            {classes.length > 0 && (
              <button
                type="button"
                onClick={() => setClassIds(allSelected ? [] : classes.map((c) => c.id))}
                className="text-xs font-semibold text-board hover:underline"
              >
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            )}
          </div>
          <p className="text-xs text-ink/45 mt-0.5 mb-2">Optional — you can also link subjects later from the Classes page.</p>
          {classesLoading ? (
            <p className="text-sm text-ink/45">Loading classes…</p>
          ) : classes.length === 0 ? (
            <p className="text-sm text-ink/45">No classes yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto border border-line rounded-lg p-2 bg-surface">
              {classes.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink/80 hover:bg-line/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={classIds.includes(c.id)}
                    onChange={() => toggleClass(c.id)}
                    className="accent-board w-4 h-4 shrink-0"
                  />
                  <span className="truncate">{c.name}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Create subject" />
      </form>
    </Modal>
  )
}
