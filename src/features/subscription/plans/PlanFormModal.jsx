import { useEffect, useState } from 'react'
import { Modal, Field, FormActions, Alert, inputClass } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { schoolsApi } from '../../schools/schools.api.js'
import { plansApi } from '../subscription.api.js'
import { describeError } from '../subscription.errors.js'
import { INTERVAL_UNITS, PLAN_CODE_PATTERN, PLAN_TYPES, ROLE_OPTIONS, SCOPES, rupeesInputToPaise } from '../subscription.constants.js'

const emptyPrice = { intervalUnit: 'MONTH', intervalCount: '1', amount: '' }
const empty = { code: '', name: '', description: '', scope: 'SELF', planType: 'BASE', targetRoles: ['PARENT'], trialOn: false, trialStart: '', trialEnd: '', schoolId: '', sortOrder: '0', isActive: true }

/** Create or edit a plan. Features and further prices are managed on the plan's detail page. */
export default function PlanFormModal({ open, onClose, plan, onSaved }) {
  const { notify } = useToast()
  const isEdit = !!plan
  const locked = isEdit && plan.totalSubscriptions > 0 // scope can't change once bought
  const [form, setForm] = useState(empty)
  const [price, setPrice] = useState(emptyPrice)
  const [withPrice, setWithPrice] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: schoolsData } = useFetch(() => schoolsApi.list({ page: 1, pageSize: 100 }), [], { enabled: open, errorMessage: 'Could not load schools.' })
  const schools = schoolsData?.items ?? []

  useEffect(() => {
    if (!open) return
    setForm(plan ? { code: plan.code, name: plan.name, description: plan.description || '', scope: plan.scope, planType: plan.planType, targetRoles: plan.targetRoles ?? [], trialOn: !!plan.trial, trialStart: plan.trial?.startDate || '', trialEnd: plan.trial?.endDate || '', schoolId: plan.school?.id || '', sortOrder: String(plan.sortOrder ?? 0), isActive: plan.isActive } : empty)
    setPrice(emptyPrice)
    setWithPrice(false)
    setErrors({})
    setServerError('')
  }, [open, plan])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setScope = (scope) => setForm((f) => ({ ...f, scope, targetRoles: scope === 'SCHOOL' ? ['ADMIN'] : f.scope === 'SCHOOL' ? ['PARENT'] : f.targetRoles }))
  const toggleRole = (r) => setForm((f) => ({ ...f, targetRoles: f.targetRoles.includes(r) ? f.targetRoles.filter((x) => x !== r) : [...f.targetRoles, r] }))

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const v = {}
    if (!isEdit && !PLAN_CODE_PATTERN.test(form.code.trim())) v.code = 'Use 2–40 letters, digits or underscores (e.g. PARENT_PLUS).'
    if (!form.name.trim() || form.name.trim().length > 100) v.name = 'Name is required (max 100 characters).'
    if (form.description.length > 500) v.description = 'Max 500 characters.'
    if (!/^\d+$/.test(form.sortOrder)) v.sortOrder = 'Enter a whole number.'
    if (form.scope !== 'SCHOOL' && form.targetRoles.length === 0) v.targetRoles = 'Choose at least one role.'
    if (form.trialOn) {
      if (!form.trialStart || !form.trialEnd) v.trial = 'Choose both a start and an end date.'
      else if (form.trialEnd < form.trialStart) v.trial = 'The end date must be on or after the start date.'
    }
    if (withPrice) {
      const count = Number(price.intervalCount)
      if (!Number.isInteger(count) || count < 1 || count > 365) v.priceCount = 'Duration must be 1–365.'
      if (rupeesInputToPaise(price.amount) == null) v.priceAmount = 'Enter an amount in ₹ (up to 2 decimals).'
    }
    setErrors(v)
    if (Object.keys(v).length) return

    const targetRoles = form.scope === 'SCHOOL' ? ['ADMIN'] : ROLE_OPTIONS.map((r) => r.value).filter((r) => form.targetRoles.includes(r))
    const trial = form.trialOn ? { startDate: form.trialStart, endDate: form.trialEnd } : undefined
    const common = { name: form.name.trim(), scope: form.scope, planType: form.planType, targetRoles, sortOrder: Number(form.sortOrder), isActive: form.isActive }
    setSubmitting(true)
    try {
      let saved
      if (isEdit) {
        const body = { ...common, description: form.description.trim() || null, schoolId: form.schoolId || null }
        if (locked) delete body.scope
        if (trial) body.trial = trial
        else if (plan.trial) body.trial = null
        saved = await plansApi.update(plan.id, body)
      } else {
        saved = await plansApi.create({
          ...common,
          ...(trial && { trial }),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || undefined,
          schoolId: form.schoolId || null,
          ...(withPrice && { prices: [{ intervalUnit: price.intervalUnit, intervalCount: Number(price.intervalCount), amount: rupeesInputToPaise(price.amount) }] }),
        })
      }
      notify(isEdit ? 'Plan updated.' : 'Plan created.', 'success')
      onSaved(saved, { isEdit })
      onClose()
    } catch (err) {
      setServerError(describeError(err, isEdit ? 'Could not update the plan.' : 'Could not create the plan.'))
    } finally {
      setSubmitting(false)
    }
  }

  const scopeHint = SCOPES.find((s) => s.value === form.scope)?.hint
  const typeHint = PLAN_TYPES.find((s) => s.value === form.planType)?.hint

  return (
    <Modal open={open} onClose={onClose} wide title={isEdit ? 'Edit plan' : 'Add plan'} subtitle={isEdit ? plan.code : 'Features and more durations can be added on the plan page'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Code" required error={errors.code} hint={isEdit ? 'The code cannot be changed.' : 'Saved in capitals, e.g. PARENT_PLUS.'}>
            <input className={`${inputClass} font-mono ${isEdit ? 'bg-line/30' : ''}`} value={form.code} onChange={set('code')} readOnly={isEdit} placeholder="PARENT_PLUS" autoFocus={!isEdit} />
          </Field>
          <Field label="Name" required error={errors.name}>
            <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Parent Plus" autoFocus={isEdit} />
          </Field>
        </div>
        <Field label="Description" error={errors.description}>
          <textarea className={inputClass} rows={2} value={form.description} onChange={set('description')} />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Scope" required hint={locked ? 'Locked — the plan has subscriptions.' : scopeHint}>
            <select className={inputClass} value={form.scope} onChange={(e) => setScope(e.target.value)} disabled={locked}>
              {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Plan type" required hint={typeHint}>
            <select className={inputClass} value={form.planType} onChange={set('planType')}>
              {PLAN_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Target roles" required error={errors.targetRoles} hint={form.scope === 'SCHOOL' ? 'School plans always target Admin.' : 'Who this plan is offered to. Pick one or more.'}>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Target roles">
            {ROLE_OPTIONS.map((r) => {
              const checked = form.scope === 'SCHOOL' ? r.value === 'ADMIN' : form.targetRoles.includes(r.value)
              const disabled = form.scope === 'SCHOOL'
              return (
                <label key={r.value} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'border-board bg-board/10 text-board' : 'border-line text-ink/60'}`}>
                  <input type="checkbox" className="accent-board" checked={checked} disabled={disabled} onChange={() => toggleRole(r.value)} /> {r.label}
                </label>
              )
            })}
          </div>
        </Field>

        <div className="rounded-xl border border-line p-4 space-y-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink/80">
            <input type="checkbox" className="accent-board" checked={form.trialOn} onChange={(e) => setForm((f) => ({ ...f, trialOn: e.target.checked }))} /> Free trial
          </label>
          {form.trialOn && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Trial starts" required>
                  <input type="date" className={inputClass} value={form.trialStart} max={form.trialEnd || undefined} onChange={set('trialStart')} />
                </Field>
                <Field label="Trial ends" required>
                  <input type="date" className={inputClass} value={form.trialEnd} min={form.trialStart || undefined} onChange={set('trialEnd')} />
                </Field>
              </div>
              {errors.trial && <p className="text-xs text-coral font-medium">{errors.trial}</p>}
            </>
          )}
          <p className="text-xs text-ink/50">Users get this plan's features free between these dates, then must pay.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Offered to" hint="All schools, or only one school.">
            <select className={inputClass} value={form.schoolId} onChange={set('schoolId')}>
              <option value="">All schools</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Sort order" error={errors.sortOrder} hint="Lower numbers show first.">
            <input className={inputClass} inputMode="numeric" value={form.sortOrder} onChange={set('sortOrder')} />
          </Field>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-ink/80">
          <input type="checkbox" className="accent-board" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /> Active (available to buy)
        </label>

        {!isEdit && (
          <div className="rounded-xl border border-line p-4 space-y-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink/80">
              <input type="checkbox" className="accent-board" checked={withPrice} onChange={(e) => setWithPrice(e.target.checked)} /> Add a first price now
            </label>
            {withPrice && (
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Every" error={errors.priceCount}>
                  <input className={inputClass} inputMode="numeric" value={price.intervalCount} onChange={(e) => setPrice((p) => ({ ...p, intervalCount: e.target.value }))} />
                </Field>
                <Field label="Unit">
                  <select className={inputClass} value={price.intervalUnit} onChange={(e) => setPrice((p) => ({ ...p, intervalUnit: e.target.value }))}>
                    {INTERVAL_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </Field>
                <Field label="Amount (₹)" error={errors.priceAmount}>
                  <input className={inputClass} inputMode="decimal" value={price.amount} onChange={(e) => setPrice((p) => ({ ...p, amount: e.target.value }))} placeholder="99" />
                </Field>
              </div>
            )}
          </div>
        )}

        <Alert>{serverError}</Alert>
        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : 'Create plan'} />
      </form>
    </Modal>
  )
}
