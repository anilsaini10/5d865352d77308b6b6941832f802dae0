import { useEffect, useState } from 'react'
import { Modal, Field, FormActions, Alert, inputClass } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { featuresApi } from '../subscription.api.js'
import { describeError } from '../subscription.errors.js'
import { FEATURE_KEY_PATTERN, ROLE_OPTIONS } from '../subscription.constants.js'

const empty = { key: '', name: '', description: '', isPaid: true, roles: [], isActive: true }

/** Create or edit a feature. The key is used by backend code, so it is read-only once created. */
export default function FeatureFormModal({ open, onClose, feature, onSaved }) {
  const { notify } = useToast()
  const isEdit = !!feature
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(feature ? { key: feature.key, name: feature.name, description: feature.description || '', isPaid: feature.isPaid, roles: feature.roles, isActive: feature.isActive } : empty)
      setErrors({})
      setServerError('')
    }
  }, [open, feature])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleRole = (r) => setForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }))

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const v = {}
    if (!isEdit && !FEATURE_KEY_PATTERN.test(form.key)) v.key = 'Use 2–50 lowercase letters, digits or underscores (e.g. ad_free).'
    if (!form.name.trim() || form.name.trim().length > 100) v.name = 'Name is required (max 100 characters).'
    if (form.description.length > 500) v.description = 'Max 500 characters.'
    if (form.roles.length === 0) v.roles = 'Select at least one role.'
    setErrors(v)
    if (Object.keys(v).length) return

    const payload = { name: form.name.trim(), description: form.description.trim() || undefined, isPaid: form.isPaid, roles: form.roles, isActive: form.isActive }
    setSubmitting(true)
    try {
      const saved = isEdit ? await featuresApi.update(feature.id, { ...payload, description: form.description.trim() || null }) : await featuresApi.create({ key: form.key, ...payload })
      notify(isEdit ? 'Feature updated.' : 'Feature created.', 'success')
      onSaved(saved)
      onClose()
    } catch (err) {
      setServerError(describeError(err, isEdit ? 'Could not update the feature.' : 'Could not create the feature.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit feature' : 'Add feature'} subtitle="A feature is a lockable piece of the app that plans unlock">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Key" required error={errors.key} hint={isEdit ? 'The key is used by backend code and cannot be changed.' : 'Lowercase letters, digits, underscore. Cannot be changed later.'}>
          <input className={`${inputClass} font-mono ${isEdit ? 'bg-line/30' : ''}`} value={form.key} onChange={set('key')} readOnly={isEdit} placeholder="ad_free" autoFocus={!isEdit} />
        </Field>
        <Field label="Name" required error={errors.name}>
          <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Ad free" autoFocus={isEdit} />
        </Field>
        <Field label="Description" error={errors.description}>
          <textarea className={inputClass} rows={2} value={form.description} onChange={set('description')} />
        </Field>

        <Field label="Roles that can use it" required error={errors.roles}>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((r) => (
              <label key={r.value} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium cursor-pointer ${form.roles.includes(r.value) ? 'border-board bg-board/10 text-board' : 'border-line text-ink/70'}`}>
                <input type="checkbox" className="accent-board" checked={form.roles.includes(r.value)} onChange={() => toggleRole(r.value)} /> {r.label}
              </label>
            ))}
          </div>
        </Field>

        <div className="flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-ink/80">
            <input type="checkbox" className="accent-board" checked={form.isPaid} onChange={(e) => setForm((f) => ({ ...f, isPaid: e.target.checked }))} /> Paid feature
            <span className="text-xs text-ink/45">(off = free for everyone)</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-medium text-ink/80">
            <input type="checkbox" className="accent-board" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /> Active
          </label>
        </div>

        <Alert>{serverError}</Alert>
        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Create feature'} />
      </form>
    </Modal>
  )
}
