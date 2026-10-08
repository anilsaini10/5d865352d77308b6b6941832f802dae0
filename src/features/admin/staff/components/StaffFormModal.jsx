import { useEffect, useState } from 'react'
import { Modal, Field, inputClass, selectClass, Alert, FormActions } from '../../../../components/ui.jsx'
import { getErrorMessage, getErrorCode } from '../../../../api/httpClient.js'
import { GENDERS } from '../../constants.js'
import { staffApi } from '../staff.api.js'
import { emptyStaffForm, staffToForm, staffFormToPayload, validateStaffForm } from '../staff.validation.js'

function changedFields(original, current) {
  const changes = {}
  for (const key of Object.keys(current)) {
    if (current[key] !== original[key]) changes[key] = current[key] ?? null
  }
  return changes
}

export default function StaffFormModal({ open, onClose, staff, onSaved }) {
  const isEdit = !!staff
  const [form, setForm] = useState(emptyStaffForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setForm(staff ? staffToForm(staff) : emptyStaffForm)
    setErrors({})
    setServerError('')
  }, [open, staff])

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateStaffForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const payload = staffFormToPayload(form)
    setSubmitting(true)
    try {
      if (isEdit) {
        const changes = changedFields(staffFormToPayload(staffToForm(staff)), payload)
        if (Object.keys(changes).length === 0) {
          onClose()
          return
        }
        onSaved(await staffApi.update(staff.id, changes), { isEdit: true })
      } else {
        onSaved(await staffApi.create(payload), { isEdit: false })
      }
      onClose()
    } catch (err) {
      const message = getErrorMessage(err, isEdit ? 'Could not update staff member.' : 'Could not add staff member.')
      const code = getErrorCode(err)
      if (code === 'EMAIL_TAKEN') setErrors((prev) => ({ ...prev, email: message }))
      else if (code === 'PHONE_TAKEN') setErrors((prev) => ({ ...prev, phone: message }))
      else setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={isEdit ? 'Edit staff member' : 'Add staff member'}
      subtitle={isEdit ? `${staff.name} · ${staff.employeeId}` : 'Non-teaching staff record — no login account is created'}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Full name" required error={errors.name}>
              <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Suresh Kumar" autoFocus />
            </Field>
          </div>
          <Field label="Phone" required error={errors.phone} hint="10-15 digits">
            <input type="tel" className={inputClass} value={form.phone} onChange={set('phone')} placeholder="9876543210" />
          </Field>
          <Field label="Email" error={errors.email} hint="Optional">
            <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="suresh@example.com" />
          </Field>
          <Field label="Gender" required error={errors.gender}>
            <select className={selectClass} value={form.gender} onChange={set('gender')}>
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Designation" required error={errors.designation}>
            <input className={inputClass} value={form.designation} onChange={set('designation')} placeholder="Accountant, Driver, Librarian..." />
          </Field>
          <Field label="Qualification" required error={errors.qualification}>
            <input className={inputClass} value={form.qualification} onChange={set('qualification')} placeholder="B.Com" />
          </Field>
          <Field label="Salary (₹)" required error={errors.salary}>
            <input type="number" min="0" step="1" inputMode="numeric" className={inputClass} value={form.salary} onChange={set('salary')} placeholder="25000" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Experience (yrs)" error={errors.experienceYears}>
              <input type="number" min="0" max="60" step="1" inputMode="numeric" className={inputClass} value={form.experienceYears} onChange={set('experienceYears')} />
            </Field>
            <Field label="Months" error={errors.experienceMonths} hint="0-11">
              <input type="number" min="0" max="11" step="1" inputMode="numeric" className={inputClass} value={form.experienceMonths} onChange={set('experienceMonths')} />
            </Field>
          </div>
          <Field label="Joining date" required error={errors.joiningDate}>
            <input type="date" className={inputClass} value={form.joiningDate} onChange={set('joiningDate')} />
          </Field>
        </div>

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Add staff member'} />
      </form>
    </Modal>
  )
}
