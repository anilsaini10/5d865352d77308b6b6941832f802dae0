import { useEffect, useState } from 'react'
import { Modal, Field, inputClass, Alert, FormActions, Button } from '../../../components/ui.jsx'
import { getErrorMessage, getErrorCode } from '../../../api/httpClient.js'
import { rolesApi } from '../roles.api.js'

function previewKey(name) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export default function RoleFormModal({ open, onClose, role, onSaved }) {
  const isEdit = !!role
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reactivateInfo, setReactivateInfo] = useState(null)

  useEffect(() => {
    if (open) {
      setName(role?.name ?? '')
      setDescription(role?.description ?? '')
      setErrors({})
      setServerError('')
      setReactivateInfo(null)
    }
  }, [open, role])

  const clearFieldError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    setReactivateInfo(null)
  }

  const validate = () => {
    const errs = {}
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) errs.name = 'Name must be at least 2 characters.'
    if (trimmed.length > 50) errs.name = 'Name must be 50 characters or fewer.'
    if (description.length > 300) errs.description = 'Description must be 300 characters or fewer.'
    return errs
  }

  const handleReactivate = async () => {
    if (!reactivateInfo) return
    setSubmitting(true)
    try {
      const updated = await rolesApi.update(reactivateInfo.roleId, { isActive: true })
      onSaved(updated, { isEdit: false, reactivated: true })
      onClose()
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not reactivate the role.'))
    } finally {
      setSubmitting(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    setReactivateInfo(null)

    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const body = {}
    const trimmedName = name.trim()
    const trimmedDesc = description.trim()

    if (isEdit) {
      if (trimmedName !== role.name) body.name = trimmedName
      const oldDesc = role.description ?? ''
      if (trimmedDesc !== oldDesc) body.description = trimmedDesc || null
      if (Object.keys(body).length === 0) {
        onClose()
        return
      }
    } else {
      body.name = trimmedName
      if (trimmedDesc) body.description = trimmedDesc
    }

    setSubmitting(true)
    try {
      let saved
      if (isEdit) {
        saved = await rolesApi.update(role.id, body)
      } else {
        saved = await rolesApi.create(body)
      }
      onSaved(saved, { isEdit })
      onClose()
    } catch (err) {
      const code = getErrorCode(err)
      const status = err?.response?.status
      const details = err?.response?.data?.error?.details

      if (status === 409 && code === 'ROLE_ALREADY_EXISTS' && details) {
        if (details.isActive === false) {
          setReactivateInfo({ roleId: details.roleId, key: details.key })
          setErrors((prev) => ({ ...prev, name: 'This role exists but is inactive.' }))
        } else {
          setErrors((prev) => ({ ...prev, name: getErrorMessage(err) }))
        }
      } else if (status === 400 && code === 'VALIDATION_ERROR') {
        setErrors((prev) => ({ ...prev, name: getErrorMessage(err) }))
      } else {
        setServerError(getErrorMessage(err, isEdit ? 'Could not update role.' : 'Could not create role.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const preview = previewKey(name)

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit role' : 'Create role'} subtitle={isEdit ? `Key: ${role.key}` : undefined}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Role name" required error={errors.name}>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError('name') }}
            placeholder="e.g. Accountant"
            maxLength={50}
            autoFocus
          />
          {!isEdit && name.trim() && (
            <span className="text-xs text-ink/45 mt-1 block">
              Will be saved as: <span className="font-mono font-semibold text-ink/60">{preview || '—'}</span>
            </span>
          )}
          {reactivateInfo && (
            <div className="mt-2">
              <Button size="sm" onClick={handleReactivate} loading={submitting}>Reactivate</Button>
            </div>
          )}
        </Field>

        {isEdit && (
          <Field label="Key" hint="Key can't be changed">
            <input className={`${inputClass} bg-line/30 cursor-not-allowed font-mono`} value={role.key} disabled />
          </Field>
        )}

        <Field label="Description" error={errors.description} hint={`${description.length}/300`}>
          <textarea
            className={`${inputClass} resize-none`}
            value={description}
            onChange={(e) => { setDescription(e.target.value); clearFieldError('description') }}
            placeholder="What this role is for (optional)"
            rows={3}
            maxLength={300}
          />
        </Field>

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Create role'} />
      </form>
    </Modal>
  )
}
