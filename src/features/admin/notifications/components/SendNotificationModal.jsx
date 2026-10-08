import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Modal, Field, inputClass, Alert, Button, FormActions, IconButton } from '../../../../components/ui.jsx'
import { getErrorMessage, getErrorCode } from '../../../../api/httpClient.js'
import { notificationsApi } from '../notifications.api.js'
import { validateSendNotificationForm } from '../notifications.validation.js'

const emptyForm = { userId: '', title: '', body: '', data: [] }

export default function SendNotificationModal({ open, onClose, onSent }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setForm(emptyForm)
    setErrors({})
    setServerError('')
  }, [open])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const setRow = (i, key) => (e) =>
    setForm((f) => ({ ...f, data: f.data.map((row, j) => (j === i ? { ...row, [key]: e.target.value } : row)) }))
  const addRow = () => setForm((f) => ({ ...f, data: [...f.data, { key: '', value: '' }] }))
  const removeRow = (i) => {
    setForm((f) => ({ ...f, data: f.data.filter((_, j) => j !== i) }))
    setErrors({})
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validationErrors = validateSendNotificationForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const payload = { userId: form.userId.trim(), title: form.title.trim(), body: form.body.trim() }
    const data = Object.fromEntries(
      form.data.map((r) => [r.key.trim(), r.value.trim()]).filter(([k]) => k),
    )
    if (Object.keys(data).length > 0) payload.data = data

    setSubmitting(true)
    try {
      await notificationsApi.send(payload)
      onSent?.()
      onClose()
    } catch (err) {
      const code = getErrorCode(err)
      const message = getErrorMessage(err, 'Could not send notification.')
      if (code === 'NOT_FOUND' || code === 'USER_NOT_FOUND') setErrors({ userId: message })
      else setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={submitting ? () => {} : onClose} title="Send notification" subtitle="Push a message to one user">
      <form onSubmit={submit} className="space-y-4">
        <Field
          label="Recipient user ID"
          required
          error={errors.userId}
          hint="The user account ID of the teacher, parent or staff member (not their employee or admission number)."
        >
          <input className={`${inputClass} font-mono`} value={form.userId} onChange={set('userId')} placeholder="e.g. 3f2a9c1e-…" autoFocus />
        </Field>

        <Field label="Title" required error={errors.title}>
          <input className={inputClass} value={form.title} onChange={set('title')} placeholder="Fee reminder" />
        </Field>

        <Field label="Message" required error={errors.body}>
          <textarea className={`${inputClass} min-h-[96px] resize-y`} value={form.body} onChange={set('body')} placeholder="Write the message..." />
        </Field>

        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink/80">Extra data</span>
            <Button variant="ghost" size="sm" icon={Plus} onClick={addRow}>Add field</Button>
          </div>
          <p className="text-xs text-ink/45 mt-0.5">Optional key/value pairs delivered with the push (e.g. for deep links).</p>
          {form.data.length > 0 && (
            <div className="space-y-2 mt-2">
              {form.data.map((row, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2">
                    <input className={`${inputClass} min-w-0`} value={row.key} onChange={setRow(i, 'key')} placeholder="Key" aria-label={`Data key ${i + 1}`} />
                    <input className={`${inputClass} min-w-0`} value={row.value} onChange={setRow(i, 'value')} placeholder="Value" aria-label={`Data value ${i + 1}`} />
                    <IconButton icon={X} label="Remove field" onClick={() => removeRow(i)} className="shrink-0" />
                  </div>
                  {errors[`data.${i}`] && <span className="text-xs text-coral mt-1 block font-medium">{errors[`data.${i}`]}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Send" />
      </form>
    </Modal>
  )
}
