import { useState } from 'react'
import { Check, Crown } from 'lucide-react'
import { Badge, Button } from '../../../../components/ui.jsx'
import { ACTION_LABELS, formatPaise, statusMeta } from '../billing.constants.js'
import { formatDate } from '../../../../utils/format.js'

const ROLE_LABELS = { PARENT: 'Parents', TEACHER: 'Teachers', ADMIN: 'Admins' }
const ROLE_ORDER = ['PARENT', 'TEACHER', 'ADMIN']

function FeaturesByRole({ features }) {
  const grouped = {}
  for (const f of features) {
    const role = f.role ?? 'ADMIN'
    if (!grouped[role]) grouped[role] = []
    grouped[role].push(f)
  }

  return (
    <div className="space-y-3">
      {ROLE_ORDER.filter((r) => grouped[r]).map((role) => (
        <div key={role}>
          <p className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-1">{ROLE_LABELS[role] ?? role} get</p>
          <ul className="space-y-1">
            {grouped[role].map((f) => (
              <li key={f.planFeatureId} className="flex items-start gap-2 text-sm text-ink/70">
                <Check size={14} className="mt-0.5 text-success shrink-0" />
                <span>{f.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function FlatFeatures({ features }) {
  return (
    <ul className="space-y-1">
      {features.map((f) => (
        <li key={f.planFeatureId} className="flex items-start gap-2 text-sm text-ink/70">
          <Check size={14} className="mt-0.5 text-success shrink-0" />
          <span>{f.name}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PlanCard({ plan, onSubscribe, loading }) {
  const [selectedPriceId, setSelectedPriceId] = useState(plan.prices[0]?.id ?? '')
  const selectedPrice = plan.prices.find((p) => p.id === selectedPriceId) ?? plan.prices[0]
  const { mySubscription, upcomingRenewal, action, coveredBySchool } = plan
  const meta = mySubscription ? statusMeta(mySubscription.status) : null
  const isSchool = plan.scope === 'SCHOOL'
  const isAddon = plan.planType === 'ADDON'
  const disabled = action === 'NONE' || loading

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
          {isSchool && <Crown size={18} className="text-chalk shrink-0 mt-1" />}
        </div>

        {meta && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {mySubscription.endDate && (
              <span className="text-xs text-ink/50">
                Ends {formatDate(mySubscription.endDate)}
                {mySubscription.daysLeft != null && ` · ${mySubscription.daysLeft} day${mySubscription.daysLeft === 1 ? '' : 's'} left`}
              </span>
            )}
          </div>
        )}
        {upcomingRenewal && (
          <p className="text-xs text-info mt-1.5">Renewal starts on {formatDate(upcomingRenewal.startDate)}</p>
        )}
      </div>

      <div className="px-5 pb-4 flex-1">
        {isSchool ? <FeaturesByRole features={plan.features} /> : <FlatFeatures features={plan.features} />}
      </div>

      <div className="border-t border-line px-5 py-4 space-y-3">
        {plan.prices.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {plan.prices.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPriceId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                  p.id === selectedPriceId
                    ? 'bg-board text-on-board border-board'
                    : 'bg-surface text-ink/60 border-line hover:border-board/30'
                }`}
              >
                {p.duration ?? p.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="text-2xl font-semibold text-ink">{formatPaise(selectedPrice?.amount)}</span>
            <span className="text-sm text-ink/45 ml-1">/ {selectedPrice?.duration ?? selectedPrice?.label}</span>
          </div>
          <Button
            disabled={disabled}
            loading={loading}
            variant={action === 'COMPLETE_PAYMENT' ? 'secondary' : 'primary'}
            onClick={() => onSubscribe(plan, selectedPriceId)}
          >
            {ACTION_LABELS[action] ?? 'Subscribe'}
          </Button>
        </div>

        {action === 'RENEW' && mySubscription?.status === 'ACTIVE' && (
          <p className="text-xs text-ink/45">The new period starts after your current plan ends.</p>
        )}
        {action === 'RENEW' && mySubscription?.status === 'EXPIRED' && (
          <p className="text-xs text-ink/45">Starts on payment confirmation.</p>
        )}
        {coveredBySchool && <p className="text-xs text-success">This plan is covered by your school.</p>}
      </div>
    </div>
  )
}
