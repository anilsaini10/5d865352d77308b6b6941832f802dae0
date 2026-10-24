import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal, Field, inputClass } from '../../../components/ui.jsx'
import { adminsApi } from '../admins.api.js'
import { validateAdminForm } from '../admins.validation.js'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'

const emptyForm = { name: '', email: '', phone: '', username: '' }

/**
 * `schoolId` fixes the target school (used from a school's own detail page).
 * Omit it and pass `schools` instead to let the user pick the school first
 * (used from the global admins list) — not used at all when editing, since
 * the admin's existing schoolId is used.
 */
export default function AdminFormModal({ open, onClose, schoolId, schools, admin, onSaved }) {
  const isEdit = !!admin
  const needsSchoolPicker = !isEdit && !schoolId && Array.isArray(schools)

  const [form, setForm] = useState(emptyForm)
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(admin ? { name: admin.name, email: admin.email, phone: admin.phone || '', username: admin.username || '' } : emptyForm)
      setSelectedSchoolId('')
    }
    setErrors({})
    setServerError('')
  }, [open, admin])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const targetSchoolId = isEdit ? admin.schoolId : schoolId || selectedSchoolId

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateAdminForm(form)
    if (needsSchoolPicker && !selectedSchoolId) validationErrors.school = 'Select a school.'
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      if (isEdit) {
        const updated = await adminsApi.update(targetSchoolId, admin.id, form)
        onSaved({ admin: updated }, { isEdit: true })
      } else {
        const result = await adminsApi.create(targetSchoolId, form)
        onSaved(result, { isEdit: false })
      }
      onClose()
    } catch (err) {
      const code = getErrorCode(err)
      const message = getErrorMessage(err, isEdit ? 'Could not update admin.' : 'Could not create admin.')
      if (code === 'USERNAME_TAKEN') setErrors((p) => ({ ...p, username: 'This username is already taken.' }))
      else if (code === 'VALIDATION_ERROR' && message.startsWith('username:')) setErrors((p) => ({ ...p, username: message.replace(/^username:\s*/, '') }))
      else setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit admin' : 'Add admin'}
      subtitle={isEdit ? admin?.name : 'Create an admin account'}
    >
      <form onSubmit={submit} className="space-y-4">
        {needsSchoolPicker && (
          <Field label="School" required error={errors.school}>
            <select className={inputClass} value={selectedSchoolId} onChange={(e) => setSelectedSchoolId(e.target.value)}>
              <option value="">Select a school</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Name" required error={errors.name}>
          <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Meera Kapoor" autoFocus={!needsSchoolPicker} />
        </Field>

        <Field label="Email" required error={errors.email}>
          <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="meera@school.edu" />
        </Field>

        <Field label="Username" error={errors.username} hint="Optional · Saved in lowercase">
          <input
            className={inputClass}
            value={form.username}
            onChange={set('username')}
            onBlur={() => setForm((f) => ({ ...f, username: f.username.trim().toLowerCase() }))}
            placeholder="meera.kapoor"
          />
        </Field>

        <Field label="Phone" error={errors.phone} hint="Optional, 10-15 digits">
          <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="9876543210" />
        </Field>

        {serverError && (
          <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-3 py-2">
            {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink/70 hover:bg-line/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-board hover:bg-board-light disabled:opacity-60 text-paper transition-colors"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {isEdit ? 'Save changes' : 'Create admin'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
