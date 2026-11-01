import { Check } from 'lucide-react'
import { Badge } from '../../../../components/ui.jsx'
import { FEATURE_ROLE_GROUPS } from '../billing.constants.js'

function Item({ f }) {
  return (
    <li className="flex items-start gap-2 text-sm text-ink/70">
      <Check size={14} className="mt-0.5 text-success shrink-0" />
      <span className="flex-1 min-w-0">{f.name}</span>
      {f.alreadyActive && <Badge tone="success">Active</Badge>}
    </li>
  )
}

/**
 * School plans: grouped under Admin / Teachers / Parents. Self plans: the admin's own features
 * (rows for another role come back with alreadyActive = null and are not the admin's).
 */
export default function PlanFeatureList({ plan }) {
  const features = plan.features ?? []
  if (!features.length) return <p className="text-sm text-ink/45">No features listed.</p>

  if (plan.scope !== 'SCHOOL') {
    return <ul className="space-y-1">{features.filter((f) => f.role == null || f.role === 'ADMIN').map((f) => <Item key={`${f.featureId}|${f.role}`} f={f} />)}</ul>
  }

  return (
    <div className="space-y-3">
      {FEATURE_ROLE_GROUPS.map(({ role, label }) => {
        const rows = features.filter((f) => f.role === role)
        if (!rows.length) return null
        return (
          <div key={role}>
            <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-1">{label}</p>
            <ul className="space-y-1">{rows.map((f) => <Item key={`${f.featureId}|${f.role}`} f={f} />)}</ul>
          </div>
        )
      })}
    </div>
  )
}
