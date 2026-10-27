import { Crown } from 'lucide-react'
import { Badge, Button } from '../../../../components/ui.jsx'
import { formatDate, formatDay } from '../../../../utils/format.js'
import { formatPaise, statusMeta } from '../billing.constants.js'
import PlanFeatureList from './PlanFeatureList.jsx'
import { TrialBadge, trialSubtitle } from './TrialInfo.jsx'

const days = (n) => `${n} day${n === 1 ? '' : 's'} left`

function StatusLine({ sub }) {
  const meta = statusMeta(sub.status)
  let note = null
  if (sub.status === 'ACTIVE' || sub.status === 'EXPIRING_SOON') note = sub.daysLeft != null ? days(sub.daysLeft) : null
  else if (sub.status === 'UPCOMING') note = `Starts ${formatDate(sub.startDate)}`
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Badge tone={meta.tone}>{meta.label}</Badge>
      {note && <span className="text-xs text-ink/50">{note}</span>}
    </div>
  )
}

export default function PlanCard({ plan, onOpen, onCancel }) {
  const { mySubscription, upcomingRenewal, action, onTrial, startingFrom } = plan
  const isAddon = plan.planType === 'ADDON'
  const subtitle = trialSubtitle(plan)
  const buttonLabel = { SUBSCRIBE: onTrial ? 'Subscribe now' : 'Subscribe', RENEW: 'Renew', COMPLETE_PAYMENT: 'Complete payment' }[action]

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card flex flex-col">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-ink">{plan.name}</h3>
              {isAddon && <span className="text-[10px] uppercase font-bold tracking-wider bg-chalk/20 text-chalk-ink border border-chalk/40 rounded-full px-2 py-0.5">Add-on</span>}
            </div>
            {plan.description && <p className="text-sm text-ink/55 mt-0.5">{plan.description}</p>}
          </div>
          {plan.scope === 'SCHOOL' && <Crown size={18} className="text-chalk shrink-0 mt-1" />}
        </div>

        <p className="mt-3 text-sm text-ink/60">
          {startingFrom
            ? <>Starting at <span className="text-2xl font-semibold text-ink">{formatPaise(startingFrom.amount)}</span> / {startingFrom.duration}</>
            : 'No price set'}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2"><TrialBadge plan={plan} /></div>
        {subtitle && <p className="text-xs text-info mt-1.5">{subtitle}</p>}
        {mySubscription && <StatusLine sub={mySubscription} />}
        {upcomingRenewal && <p className="text-xs text-info mt-1.5">Renewal starts {formatDate(upcomingRenewal.startDate)}</p>}
      </div>

      <div className="px-5 pb-4 flex-1"><PlanFeatureList plan={plan} /></div>

      <div className="border-t border-line px-5 py-4 flex items-center justify-between gap-3">
        {action === 'NONE' || !buttonLabel ? (
          <p className="text-xs text-success">{plan.coveredBySchool || action === 'NONE' ? 'Included by your school' : ''}</p>
        ) : (
          <>
            {action === 'COMPLETE_PAYMENT'
              ? <button type="button" onClick={() => onCancel(plan)} className="text-sm font-semibold text-coral hover:underline">Cancel</button>
              : <span />}
            <Button variant={action === 'COMPLETE_PAYMENT' ? 'secondary' : 'primary'} onClick={() => onOpen(plan)}>{buttonLabel}</Button>
          </>
        )}
      </div>
    </div>
  )
}
