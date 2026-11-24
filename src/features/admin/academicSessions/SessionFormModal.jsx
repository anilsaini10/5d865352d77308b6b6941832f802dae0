import { useState, useEffect } from 'react'
import { Modal, Field, inputClass, FormActions } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { academicSessionsApi } from './academicSessions.api.js'

export default function SessionFormModal({ open, onClose, session, onSaved }) {
  const { notify } = useToast()
  const isEdit = !!session

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(session?.name ?? '')
      setStartDate(session?.startDate?.slice(0, 10) ?? '')
      setEndDate(session?.endDate?.slice(0, 10) ?? '')
      setIsCurrent(session?.isCurrent ?? false)
      setSubmitting(false)
    }
  }, [open, session])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = { name: name.trim(), startDate, endDate, isCurrent }
      if (isEdit) {
        await academicSessionsApi.update(session.id, body)
        notify('Session updated.', 'success')
      } else {
        await academicSessionsApi.create(body)
        notify('Session created.', 'success')
      }
      onSaved()
      onClose()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not save session.'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Session' : 'Add Academic Session'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Session Name" required>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2025-26" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date" required>
            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </Field>
          <Field label="End Date" required>
            <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </Field>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="w-4 h-4 rounded border-line text-board focus:ring-board/30"
          />
          <span className="text-sm font-semibold text-ink/80">Set as current session</span>
        </label>
        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Update' : 'Create'} />
      </form>
    </Modal>
  )
}
