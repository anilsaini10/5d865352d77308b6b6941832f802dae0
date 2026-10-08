import { useEffect, useState } from 'react'
import { Modal, Field, inputClass, Alert, FormActions, Tabs, WarningNote } from '../../../../components/ui.jsx'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { toDateTimeInput, fromDateTimeInput } from '../../../../utils/format.js'
import { AUDIENCES } from '../../constants.js'
import { announcementsApi } from '../announcements.api.js'
import { validateAnnouncementForm } from '../announcements.validation.js'

const emptyForm = { title: '', message: '', audience: 'ALL', eventDate: '', publishAt: '', expiresAt: '' }

const dateOnly = (value) => (value ? String(value).slice(0, 10) : '')

function toForm(a) {
  return {
    title: a.title ?? '',
    message: a.message ?? '',
    audience: a.audience ?? 'ALL',
    eventDate: dateOnly(a.eventDate),
    publishAt: toDateTimeInput(a.publishAt),
    expiresAt: toDateTimeInput(a.expiresAt),
  }
}

export default function AnnouncementFormModal({ open, onClose, announcement, onSaved }) {
  const isEdit = !!announcement
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setForm(announcement ? toForm(announcement) : emptyForm)
    setErrors({})
    setServerError('')
  }, [open, announcement])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const publishInFuture = form.publishAt && new Date(form.publishAt) > new Date()

  const buildPayload = () => {
    const body = {
      title: form.title.trim(),
      message: form.message.trim(),
      audience: form.audience,
    }
    const optional = {
      eventDate: form.eventDate || undefined,
      publishAt: fromDateTimeInput(form.publishAt),
      expiresAt: fromDateTimeInput(form.expiresAt),
    }
    for (const [key, value] of Object.entries(optional)) {
      if (value) body[key] = value
      // On edit, explicitly clear a date the admin removed.
      else if (isEdit && announcement[key]) body[key] = null
    }
    return body
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validationErrors = validateAnnouncementForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      const body = buildPayload()
      const saved = isEdit ? await announcementsApi.update(announcement.id, body) : await announcementsApi.create(body)
      onSaved(saved, { isEdit })
      onClose()
    } catch (err) {
      setServerError(getErrorMessage(err, isEdit ? 'Could not update announcement.' : 'Could not create announcement.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      wide
      title={isEdit ? 'Edit announcement' : 'New announcement'}
      subtitle={isEdit ? announcement?.title : 'Notify teachers and/or parents'}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" required error={errors.title}>
          <input className={inputClass} value={form.title} onChange={set('title')} placeholder="Annual day rehearsal" autoFocus />
        </Field>

        <Field label="Message" required error={errors.message}>
          <textarea className={`${inputClass} min-h-[120px] resize-y`} value={form.message} onChange={set('message')} placeholder="Write the announcement..." />
        </Field>

        <div>
          <span className="text-sm font-semibold text-ink/80">Audience</span>
          <div className="mt-1.5 max-w-full overflow-x-auto">
            <Tabs options={AUDIENCES} value={form.audience} onChange={(audience) => setForm((f) => ({ ...f, audience }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Event date" hint="Optional">
            <input type="date" className={inputClass} value={form.eventDate} onChange={set('eventDate')} />
          </Field>
          <Field label="Publish at" hint="Optional — defaults to now" error={errors.publishAt}>
            <input type="datetime-local" className={inputClass} value={form.publishAt} onChange={set('publishAt')} />
          </Field>
          <Field label="Expires at" hint="Optional" error={errors.expiresAt}>
            <input type="datetime-local" className={inputClass} value={form.expiresAt} onChange={set('expiresAt')} />
          </Field>
        </div>

        {publishInFuture && (
          <WarningNote>
            The publish time is in the future, so <strong>no push or in-app notification will be sent</strong> — notifications are
            only sent when the announcement is saved, and nothing fires them later. The announcement will simply become visible at
            the publish time.
          </WarningNote>
        )}

        {isEdit && !publishInFuture && (
          <Alert tone="info">Saving changes sends the notification to the audience again.</Alert>
        )}

        <Alert>{serverError}</Alert>

        {submitting && <p className="text-xs text-ink/50">Sending notifications — this can take a few seconds…</p>}

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Publish announcement'} />
      </form>
    </Modal>
  )
}
