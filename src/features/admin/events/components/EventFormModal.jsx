import { useEffect, useState } from 'react'
import { Modal, Field, inputClass, selectClass, Alert, FormActions, Tabs } from '../../../../components/ui.jsx'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { AUDIENCES, EVENT_TYPES } from '../../constants.js'
import { eventsApi } from '../events.api.js'
import { validateEventForm } from '../events.validation.js'
import { dayKey } from './eventUtils.js'

const emptyForm = { title: '', description: '', eventType: 'OTHER', audience: 'ALL', startDate: '', endDate: '' }

function toForm(ev) {
  const start = dayKey(ev.startDate)
  const end = dayKey(ev.endDate)
  return {
    title: ev.title ?? '',
    description: ev.description ?? '',
    eventType: ev.eventType ?? 'OTHER',
    audience: ev.audience ?? 'ALL',
    startDate: start,
    endDate: end && end !== start ? end : '',
  }
}

/** `defaultDate` ("YYYY-MM-DD") pre-fills the start date when creating from a calendar day. */
export default function EventFormModal({ open, onClose, event, defaultDate, onSaved }) {
  const isEdit = !!event
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setForm(event ? toForm(event) : { ...emptyForm, startDate: defaultDate || '' })
    setErrors({})
    setServerError('')
  }, [open, event, defaultDate])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const buildPayload = () => {
    const body = {
      title: form.title.trim(),
      eventType: form.eventType,
      audience: form.audience,
      startDate: form.startDate,
    }
    const description = form.description.trim()
    if (description) body.description = description
    else if (isEdit && event.description) body.description = null

    if (form.endDate) body.endDate = form.endDate
    // Clearing the end date on edit collapses the event back to a single day.
    else if (isEdit) body.endDate = form.startDate
    return body
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validationErrors = validateEventForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      const body = buildPayload()
      const saved = isEdit ? await eventsApi.update(event.id, body) : await eventsApi.create(body)
      onSaved(saved, { isEdit })
      onClose()
    } catch (err) {
      setServerError(getErrorMessage(err, isEdit ? 'Could not update event.' : 'Could not create event.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      wide
      title={isEdit ? 'Edit event' : 'New event'}
      subtitle={isEdit ? event?.title : 'Add an event to the school calendar'}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" required error={errors.title}>
          <input className={inputClass} value={form.title} onChange={set('title')} placeholder="Half-yearly exams" autoFocus />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Event type" required error={errors.eventType}>
            <select className={selectClass} value={form.eventType} onChange={set('eventType')}>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <div>
            <span className="text-sm font-semibold text-ink/80">Audience</span>
            <div className="mt-1.5 max-w-full overflow-x-auto">
              <Tabs options={AUDIENCES} value={form.audience} onChange={(audience) => setForm((f) => ({ ...f, audience }))} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start date" required error={errors.startDate}>
            <input type="date" className={inputClass} value={form.startDate} onChange={set('startDate')} />
          </Field>
          <Field label="End date" hint="Optional — leave empty for a one-day event" error={errors.endDate}>
            <input type="date" className={inputClass} value={form.endDate} min={form.startDate || undefined} onChange={set('endDate')} />
          </Field>
        </div>

        <Field label="Description" hint="Optional">
          <textarea className={`${inputClass} min-h-[100px] resize-y`} value={form.description} onChange={set('description')} placeholder="Details for teachers and parents..." />
        </Field>

        <Alert tone="info">
          {isEdit ? 'Saving changes may notify the audience again.' : 'The audience is notified when the event is created.'}
        </Alert>

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Create event'} />
      </form>
    </Modal>
  )
}
