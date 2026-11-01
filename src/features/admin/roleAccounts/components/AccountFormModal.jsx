import { useEffect, useState } from 'react'
import { Modal, Field, inputClass, selectClass, Alert, FormActions } from '../../../../components/ui.jsx'
import { getErrorMessage, getErrorCode } from '../../../../api/httpClient.js'
import { roleAccountsApi } from '../roleAccounts.api.js'

const PHONE_RE = /^[0-9]{10}$/
const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9._]{2,29}$/

function normalizePhone(raw) {
  return raw.replace(/[\s+\-()]/g, '').replace(/^(\+?91|0)/, '')
}

function validate(form) {
  const errors = {}
  if (!form.customRoleId) errors.customRoleId = 'Select a role.'
  const name = form.name.trim()
  if (!name || name.length < 2) errors.name = 'Name must be at least 2 characters.'
  if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.'
  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email.'
  const phone = form.phone.trim()
  if (phone && !PHONE_RE.test(normalizePhone(phone))) errors.phone = 'Enter a valid 10-digit mobile number.'
  const username = form.username.trim()
  if (username && !USERNAME_RE.test(username)) errors.username = '3–30 chars, starts with a letter, letters/digits/./_ only.'
  return errors
}

export default function AccountFormModal({ open, onClose, account, roles, onSaved, onRolesStale }) {
  const isEdit = !!account
  const [form, setForm] = useState({ customRoleId: '', name: '', email: '', phone: '', username: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (account) {
        setForm({
          customRoleId: account.customRole?.id ?? '',
          name: account.name ?? '',
          email: account.email ?? '',
          phone: account.phone ?? '',
          username: account.username ?? '',
        })
      } else {
        setForm({ customRoleId: roles?.length === 1 ? roles[0].id : '', name: '', email: '', phone: '', username: '' })
      }
      setErrors({})
      setServerError('')
    }
  }, [open, account, roles])

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const phone = form.phone.trim() ? normalizePhone(form.phone.trim()) : undefined
    const username = form.username.trim() || undefined

    setSubmitting(true)
    try {
      if (isEdit) {
        const body = {}
        if (form.name.trim() !== account.name) body.name = form.name.trim()
        if (form.email.trim() !== account.email) body.email = form.email.trim()
        if (form.customRoleId !== account.customRole?.id) body.customRoleId = form.customRoleId
        const oldPhone = account.phone ?? ''
        const newPhone = phone ?? ''
        if (newPhone !== oldPhone) body.phone = phone ?? null
        const oldUsername = account.username ?? ''
        const newUsername = username ?? ''
        if (newUsername !== oldUsername) body.username = username ?? null
        if (Object.keys(body).length === 0) {
          onClose()
          return
        }
        const saved = await roleAccountsApi.update(account.id, body)
        onSaved(saved, { isEdit: true })
        onClose()
      } else {
        const body = {
          customRoleId: form.customRoleId,
          name: form.name.trim(),
          email: form.email.trim(),
        }
        if (phone) body.phone = phone
        if (username) body.username = username
        const result = await roleAccountsApi.create(body)
        onSaved(result, { isEdit: false })
        onClose()
      }
    } catch (err) {
      const code = getErrorCode(err)
      const status = err?.response?.status
      if (code === 'EMAIL_TAKEN') setErrors((prev) => ({ ...prev, email: getErrorMessage(err) }))
      else if (code === 'PHONE_TAKEN') setErrors((prev) => ({ ...prev, phone: getErrorMessage(err) }))
      else if (code === 'USERNAME_TAKEN') setErrors((prev) => ({ ...prev, username: getErrorMessage(err) }))
      else if (status === 404 && code === 'ROLE_NOT_FOUND') {
        setServerError('This role was just deactivated. Please refresh and try again.')
        onRolesStale?.()
      } else {
        setServerError(getErrorMessage(err, isEdit ? 'Could not update account.' : 'Could not create account.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} wide title={isEdit ? 'Edit account' : 'Create account'} subtitle={isEdit ? account.name : 'Create a login account for a custom-role user'}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Role" required error={errors.customRoleId}>
              <select className={selectClass} value={form.customRoleId} onChange={set('customRoleId')}>
                <option value="">Select a role</option>
                {(roles ?? []).map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Full name" required error={errors.name}>
              <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Suresh Kumar" autoFocus />
            </Field>
          </div>
          <Field label="Email" required error={errors.email}>
            <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="suresh@example.com" />
          </Field>
          <Field label="Phone" error={errors.phone} hint="10-digit mobile (optional)">
            <input type="tel" className={inputClass} value={form.phone} onChange={set('phone')} placeholder="9876543210" />
          </Field>
          <Field label="Username" error={errors.username} hint="Optional login alias">
            <input className={inputClass} value={form.username} onChange={set('username')} placeholder="suresh.kumar" />
          </Field>
        </div>

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Create account'} />
      </form>
    </Modal>
  )
}
