import { useEffect, useState } from 'react'
import { Modal, Field, inputClass, selectClass, Alert, FormActions, WarningNote } from '../../../../components/ui.jsx'
import { getErrorMessage, getErrorCode } from '../../../../api/httpClient.js'
import { GENDERS } from '../../constants.js'
import { staffApi } from '../staff.api.js'
import { emptyStaffForm, staffToForm, staffFormToPayload, validateStaffForm } from '../staff.validation.js'
import { roleAccountsApi } from '../../roleAccounts/roleAccounts.api.js'
import { useFetch } from '../../../../hooks/useFetch.js'

function changedFields(original, current) {
  const changes = {}
  for (const key of Object.keys(current)) {
    if (current[key] !== original[key]) changes[key] = current[key] ?? null
  }
  return changes
}

export default function StaffFormModal({ open, onClose, staff, onSaved }) {
  const isEdit = !!staff
  const { data: rolesData } = useFetch(() => roleAccountsApi.listRoles(), [], { errorMessage: 'Could not load roles.' })
  const roles = Array.isArray(rolesData) ? rolesData : rolesData?.items ?? []
  const [form, setForm] = useState(emptyStaffForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const originalRoleId = staff?.customRoleId ?? staff?.customRole?.id ?? ''
  const roleChanged = isEdit && form.customRoleId && form.customRoleId !== originalRoleId
  const loginDisabling = isEdit && staff?.isActive && !form.isActive

  useEffect(() => {
    if (open) setForm(staff ? staffToForm(staff) : emptyStaffForm)
    setErrors({})
    setServerError('')
  }, [open, staff])

  const set = (key) => (e) => {
    const value = e.target.value
    if (key === 'customRoleId') {
      const role = roles.find((r) => r.id === value)
      setForm((f) => ({ ...f, customRoleId: value, designation: role?.name ?? '' }))
      if (errors.customRoleId) setErrors((prev) => ({ ...prev, customRoleId: undefined }))
    } else {
      setForm((f) => ({ ...f, [key]: value }))
    }
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const toggleActive = () => {
    setForm((f) => ({ ...f, isActive: !f.isActive }))
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
        if (form.isActive !== (staff.isActive ?? true)) changes.isActive = form.isActive
        if (Object.keys(changes).length === 0) {
          onClose()
          return
        }
        const updated = await staffApi.update(staff.id, changes)
        onSaved(updated, { isEdit: true })
      } else {
        const result = await staffApi.create(payload)
        onSaved(result, { isEdit: false })
      }
      onClose()
    } catch (err) {
      const message = getErrorMessage(err, isEdit ? 'Could not update staff member.' : 'Could not add staff member.')
      const code = getErrorCode(err)
      if (code === 'EMAIL_TAKEN') setErrors((prev) => ({ ...prev, email: message }))
      else if (code === 'PHONE_TAKEN') setErrors((prev) => ({ ...prev, phone: message }))
      else if (code === 'USERNAME_TAKEN') setErrors((prev) => ({ ...prev, username: message }))
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
      subtitle={isEdit ? `${staff.name} · ${staff.employeeId}` : 'A login account is created automatically'}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Full name" required error={errors.name}>
              <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Suresh Kumar" autoFocus />
            </Field>
          </div>
          <Field label="Email" required error={errors.email} hint="Used as login identifier">
            <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="suresh@school.com" />
          </Field>
          <Field label="Phone" required error={errors.phone} hint="10-15 digits">
            <input type="tel" className={inputClass} value={form.phone} onChange={set('phone')} placeholder="9876543210" />
          </Field>
          <Field label="Username" error={errors.username} hint="Optional login username">
            <input className={inputClass} value={form.username} onChange={set('username')} placeholder="suresh.kumar" />
          </Field>
          <Field label="Role / Designation" required error={errors.customRoleId}>
            <select className={selectClass} value={form.customRoleId} onChange={set('customRoleId')}>
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Gender" required error={errors.gender}>
            <select className={selectClass} value={form.gender} onChange={set('gender')}>
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Salary (₹)" required error={errors.salary}>
            <input type="number" min="0" step="1" inputMode="numeric" className={inputClass} value={form.salary} onChange={set('salary')} placeholder="25000" />
          </Field>
          <Field label="Qualification" required error={errors.qualification}>
            <input className={inputClass} value={form.qualification} onChange={set('qualification')} placeholder="B.Com" />
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

        {isEdit && staff?.userId && (
          <div className="border border-line rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Login Access</p>
                <p className="text-xs text-ink/50">{form.isActive ? 'Staff member can log in' : 'Login is disabled'}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isActive}
                onClick={toggleActive}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer ${form.isActive ? 'bg-board' : 'bg-line'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            {loginDisabling && (
              <WarningNote>This will immediately log out this staff member from all devices.</WarningNote>
            )}
          </div>
        )}

        {roleChanged && (
          <WarningNote>Changing role will log out the staff member from all devices.</WarningNote>
        )}

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Add staff member'} />
      </form>
    </Modal>
  )
}
