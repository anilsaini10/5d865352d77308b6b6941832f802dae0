import { Badge } from '../../../components/ui.jsx'
import { roleLabel, trialBadge } from '../subscription.constants.js'

export function RoleChips({ roles = [] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {roles.map((r) => <Badge key={r} tone="neutral">{roleLabel(r)}</Badge>)}
    </span>
  )
}

export function TrialBadge({ trial }) {
  const b = trialBadge(trial)
  return b ? <Badge tone={b.tone}>{b.text}</Badge> : null
}
