import { useMemo, useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { Alert, Badge, Button, Card, IconButton, Modal } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { plansApi, featuresApi } from '../subscription.api.js'
import { describeError } from '../subscription.errors.js'
import { ROLE_OPTIONS, roleLabel } from '../subscription.constants.js'

const keyOf = (featureId, role) => `${featureId}|${role}`

/** "Features in this plan": list grouped by role for school plans, plus a multi-select editor that replaces the full list. */
export default function PlanFeaturesSection({ plan, onChange }) {
  const { notify } = useToast()
  const [editing, setEditing] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const isSchool = plan.scope === 'SCHOOL'

  const remove = async (pf) => {
    setRemovingId(pf.planFeatureId)
    try {
      onChange(await plansApi.removeFeature(plan.id, pf.planFeatureId))
      notify(`${pf.name} removed from the plan.`, 'success')
    } catch (err) {
      notify(describeError(err, 'Could not remove the feature.'), 'error')
    } finally {
      setRemovingId(null)
    }
  }

  const groups = isSchool ? ROLE_OPTIONS.map((r) => ({ role: r.value, rows: plan.features.filter((f) => f.role === r.value) })).filter((g) => g.rows.length) : [{ role: plan.targetRole, rows: plan.features }]

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Features in this plan</h2>
          <p className="text-sm text-ink/55">{isSchool ? 'Choose which roles in the school get each feature.' : `Features unlocked for ${roleLabel(plan.targetRole)}s who buy this plan.`}</p>
        </div>
        <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit features</Button>
      </div>

      {plan.features.length === 0 ? (
        <p className="text-sm text-ink/50 py-4">No features attached yet — this plan unlocks nothing. Click “Edit features”.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.role}>
              {isSchool && <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-2">{roleLabel(g.role)}</p>}
              <ul className="divide-y divide-line border border-line rounded-xl">
                {g.rows.map((f) => (
                  <li key={f.planFeatureId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{f.name} <span className="font-mono text-xs text-ink/40 font-normal ml-1">{f.key}</span></p>
                      {f.description && <p className="text-xs text-ink/50 truncate">{f.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!f.isActive && <Badge tone="inactive">Inactive</Badge>}
                      <Badge tone={f.isPaid ? 'amber' : 'success'}>{f.isPaid ? 'Paid' : 'Free'}</Badge>
                      <IconButton icon={X} label={`Remove ${f.name}`} tone="danger" disabled={removingId === f.planFeatureId} onClick={() => remove(f)} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {editing && <FeaturePicker plan={plan} onClose={() => setEditing(false)} onSaved={(p) => { onChange(p); setEditing(false); notify('Plan features saved.', 'success') }} />}
    </Card>
  )
}

function FeaturePicker({ plan, onClose, onSaved }) {
  const isSchool = plan.scope === 'SCHOOL'
  const { data, loading, error } = useFetch(() => featuresApi.list(), [], { errorMessage: 'Could not load features.' })
  const [selected, setSelected] = useState(() => new Set(plan.features.map((f) => keyOf(f.featureId, f.role))))
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  // Only offer features that support the role; keep already-attached ones visible so saving never drops them silently.
  const rolesOf = (f) => (isSchool ? ROLE_OPTIONS.map((r) => r.value).filter((r) => f.roles.includes(r)) : f.roles.includes(plan.targetRole) ? [plan.targetRole] : [])
  const attached = useMemo(() => new Set(plan.features.map((f) => f.featureId)), [plan.features])
  const rows = useMemo(
    () => (data ?? []).filter((f) => (f.isActive || attached.has(f.id)) && rolesOf(f).length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, attached]
  )

  const toggle = (k) => setSelected((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n })

  const save = async () => {
    setServerError('')
    const features = []
    rows.forEach((f) => rolesOf(f).forEach((r) => selected.has(keyOf(f.id, r)) && features.push(isSchool ? { featureId: f.id, role: r } : { featureId: f.id })))
    setSaving(true)
    try {
      onSaved(await plansApi.setFeatures(plan.id, features))
    } catch (err) {
      setServerError(describeError(err, 'Could not save the features.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={saving ? () => {} : onClose} wide title="Edit plan features" subtitle={isSchool ? 'Tick the roles that get each feature' : `Features for ${roleLabel(plan.targetRole)}s`}>
      {loading ? <p className="text-sm text-ink/50 py-6 text-center">Loading features…</p> : error ? <Alert>{error}</Alert> : rows.length === 0 ? (
        <p className="text-sm text-ink/55 py-6 text-center">No features support {isSchool ? 'these roles' : `the ${roleLabel(plan.targetRole)} role`} yet. Create one on the Features page first.</p>
      ) : (
        <ul className="divide-y divide-line border border-line rounded-xl max-h-[50vh] overflow-y-auto">
          {rows.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{f.name} <span className="font-mono text-xs text-ink/40 font-normal ml-1">{f.key}</span></p>
                <p className="text-xs text-ink/45">{f.isPaid ? 'Paid' : 'Free'}{!f.isActive && ' · inactive'}</p>
              </div>
              <div className="flex gap-2">
                {rolesOf(f).map((r) => (
                  <label key={r} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer ${selected.has(keyOf(f.id, r)) ? 'border-board bg-board/10 text-board' : 'border-line text-ink/60'}`}>
                    <input type="checkbox" className="accent-board" checked={selected.has(keyOf(f.id, r))} onChange={() => toggle(keyOf(f.id, r))} aria-label={`${f.name} for ${roleLabel(r)}`} />
                    {isSchool ? roleLabel(r) : 'Include'}
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Alert className="mt-3">{serverError}</Alert>
      <div className="flex items-center justify-between gap-2 pt-4">
        <p className="text-xs text-ink/45">Saving replaces the plan's whole feature list.</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} disabled={loading || !!error}>Save features</Button>
        </div>
      </div>
    </Modal>
  )
}
