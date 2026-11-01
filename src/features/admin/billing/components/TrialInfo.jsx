import { Badge } from '../../../../components/ui.jsx'
import { formatDay } from '../../../../utils/format.js'
import { formatPaise } from '../billing.constants.js'

/** Trial badge for a plan card: on trial → days left, scheduled → start day, ended / none → nothing. */
export function TrialBadge({ plan }) {
  const { trial, onTrial } = plan
  if (!trial) return null
  if (onTrial) return <Badge tone="info">Free trial · {trial.daysLeft} day{trial.daysLeft === 1 ? '' : 's'} left</Badge>
  if (trial.status === 'SCHEDULED') return <Badge tone="info">Free trial from {formatDay(trial.startDate)}</Badge>
  return null
}

export function trialSubtitle(plan) {
  if (!plan.onTrial || !plan.trial) return null
  const from = plan.startingFrom
  return `Free until ${formatDay(plan.trial.endDate)}${from ? `, then ${formatPaise(from.amount)}/${from.duration}` : ''}`
}
