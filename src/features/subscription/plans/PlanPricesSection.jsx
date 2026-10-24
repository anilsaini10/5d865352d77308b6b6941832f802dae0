import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert, Badge, Button, Card, ConfirmDialog, Field, FormActions, IconButton, Modal, inputClass } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorCode } from '../../../api/httpClient.js'
import { plansApi } from '../subscription.api.js'
import { describeError } from '../subscription.errors.js'
import { INTERVAL_UNITS, durationLabel, formatPaise, paiseToInput, rupeesInputToPaise } from '../subscription.constants.js'
import ActiveSwitch from './ActiveSwitch.jsx'

/** "Prices / durations": any duration (count × day/month/year). Duration is fixed once created. */
export default function PlanPricesSection({ plan, onChange }) {
  const { notify } = useToast()
  const [form, setForm] = useState({ open: false, price: null })
  const [toDelete, setToDelete] = useState(null)
  const [toDeactivate, setToDeactivate] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const toggle = async (p) => {
    setTogglingId(p.id)
    try {
      onChange(await plansApi.updatePrice(plan.id, p.id, { isActive: !p.isActive }))
    } catch (err) {
      notify(describeError(err, 'Could not update the price.'), 'error')
    } finally {
      setTogglingId(null)
    }
  }
  const remove = async () => {
    const p = toDelete
    try {
      onChange(await plansApi.removePrice(plan.id, p.id))
      notify('Price deleted.', 'success')
    } catch (err) {
      if (getErrorCode(err) === 'PLAN_PRICE_IN_USE') setToDeactivate(p)
      else notify(describeError(err, 'Could not delete the price.'), 'error')
    }
  }
  const deactivate = async () => {
    try {
      onChange(await plansApi.updatePrice(plan.id, toDeactivate.id, { isActive: false }))
      notify('Price deactivated.', 'success')
    } catch (err) {
      notify(describeError(err, 'Could not deactivate the price.'), 'error')
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Prices / durations</h2>
          <p className="text-sm text-ink/55">Changing a price never affects subscriptions already bought. To change a duration, add a new price and deactivate the old one.</p>
        </div>
        <Button icon={Plus} onClick={() => setForm({ open: true, price: null })}>Add price</Button>
      </div>

      {plan.prices.length === 0 ? (
        <p className="text-sm text-ink/50 py-4">No prices yet — nobody can buy this plan until you add one.</p>
      ) : (
        <ul className="divide-y divide-line border border-line rounded-xl">
          {plan.prices.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">{p.label || p.duration || durationLabel(p.intervalUnit, p.intervalCount)} {!p.isActive && <Badge tone="inactive">Inactive</Badge>}</p>
                <p className="text-xs text-ink/50">{durationLabel(p.intervalUnit, p.intervalCount)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-ink">{formatPaise(p.amount)}</span>
                <ActiveSwitch checked={p.isActive} busy={togglingId === p.id} label={p.label || p.duration} onToggle={() => toggle(p)} />
                <IconButton icon={Pencil} label="Edit price" onClick={() => setForm({ open: true, price: p })} />
                <IconButton icon={Trash2} label="Delete price" tone="danger" onClick={() => setToDelete(p)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <PriceFormModal open={form.open} plan={plan} price={form.price} onClose={() => setForm({ open: false, price: null })} onSaved={onChange} />
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={remove} title="Delete price?"
        message={<>Delete the <strong>{toDelete && (toDelete.label || durationLabel(toDelete.intervalUnit, toDelete.intervalCount))}</strong> price? This only works if nobody has bought it.</>} />
      <ConfirmDialog open={!!toDeactivate} onClose={() => setToDeactivate(null)} onConfirm={deactivate} title="Price has been bought" confirmLabel="Deactivate" danger={false}
        message="This price is used by existing subscriptions, so it can't be deleted. Deactivate it instead? Existing subscribers are not affected." />
    </Card>
  )
}

function PriceFormModal({ open, plan, price, onClose, onSaved }) {
  const { notify } = useToast()
  const isEdit = !!price
  const [form, setForm] = useState({ intervalUnit: 'MONTH', intervalCount: '1', amount: '', label: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(price ? { intervalUnit: price.intervalUnit, intervalCount: String(price.intervalCount), amount: paiseToInput(price.amount), label: price.label || '' } : { intervalUnit: 'MONTH', intervalCount: '1', amount: '', label: '' })
    setErrors({})
    setServerError('')
  }, [open, price])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const v = {}
    const count = Number(form.intervalCount)
    const paise = rupeesInputToPaise(form.amount)
    if (!isEdit && (!Number.isInteger(count) || count < 1 || count > 365)) v.intervalCount = 'Duration must be a whole number from 1 to 365.'
    if (paise == null) v.amount = 'Enter an amount in ₹ greater than 0 (up to 2 decimals).'
    if (form.label.length > 50) v.label = 'Max 50 characters.'
    setErrors(v)
    if (Object.keys(v).length) return

    setSubmitting(true)
    try {
      const updated = isEdit
        ? await plansApi.updatePrice(plan.id, price.id, { label: form.label.trim() || null, amount: paise })
        : await plansApi.addPrice(plan.id, { intervalUnit: form.intervalUnit, intervalCount: count, amount: paise, ...(form.label.trim() && { label: form.label.trim() }), currency: 'INR' })
      notify(isEdit ? 'Price updated.' : 'Price added.', 'success')
      onSaved(updated)
      onClose()
    } catch (err) {
      setServerError(describeError(err, isEdit ? 'Could not update the price.' : 'Could not add the price.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit price' : 'Add price'} subtitle={isEdit ? `Duration: ${durationLabel(price.intervalUnit, price.intervalCount)} (cannot be changed)` : plan.name}>
      <form onSubmit={submit} className="space-y-4">
        {!isEdit && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Every" required error={errors.intervalCount}>
              <input className={inputClass} inputMode="numeric" value={form.intervalCount} onChange={set('intervalCount')} autoFocus />
            </Field>
            <Field label="Unit" required>
              <select className={inputClass} value={form.intervalUnit} onChange={set('intervalUnit')}>
                {INTERVAL_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </Field>
          </div>
        )}
        <Field label="Amount (₹)" required error={errors.amount} hint="Saved internally in paise.">
          <input className={inputClass} inputMode="decimal" value={form.amount} onChange={set('amount')} placeholder="499" autoFocus={isEdit} />
        </Field>
        <Field label="Label" error={errors.label} hint="Optional, e.g. “Best value”. Defaults to the duration.">
          <input className={inputClass} value={form.label} onChange={set('label')} />
        </Field>
        <Alert>{serverError}</Alert>
        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save price' : 'Add price'} />
      </form>
    </Modal>
  )
}
