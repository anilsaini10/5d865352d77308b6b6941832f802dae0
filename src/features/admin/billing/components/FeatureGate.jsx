import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button } from '../../../../components/ui.jsx'
import { useEntitlements } from '../EntitlementsContext.jsx'
import { LOCK_CTA, formatPaise } from '../billing.constants.js'

export default function FeatureGate({ featureKey, children }) {
  const navigate = useNavigate()
  const { hasFeature, getFeature } = useEntitlements()

  if (hasFeature(featureKey)) return children

  const feat = getFeature(featureKey)
  const reason = feat?.reason ?? 'NEVER_SUBSCRIBED'
  const cta = LOCK_CTA[reason] ?? LOCK_CTA.NEVER_SUBSCRIBED
  const plan = feat?.availableIn?.[0]

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="w-16 h-16 rounded-2xl bg-ink/5 border border-line flex items-center justify-center mb-5">
        <Lock size={28} className="text-ink/30" />
      </div>
      <h3 className="font-display text-xl font-semibold text-ink">{feat?.name ?? 'Feature locked'}</h3>
      <p className="text-sm text-ink/55 mt-2 max-w-md">
        {reason === 'NEVER_SUBSCRIBED' && 'Subscribe to a plan to unlock this feature.'}
        {reason === 'EXPIRED' && 'Your subscription has expired. Renew to regain access.'}
        {reason === 'PENDING_PAYMENT' && 'Your subscription is awaiting payment confirmation.'}
      </p>
      {plan && (
        <p className="text-xs text-ink/40 mt-2">
          Available in <span className="font-semibold text-ink/60">{plan.name}</span>
          {plan.startingFrom && <> from {formatPaise(plan.startingFrom.amount)}/{plan.startingFrom.duration}</>}
        </p>
      )}
      <div className="mt-5">
        <Button onClick={() => navigate('/billing/plans')}>{cta.label}</Button>
      </div>
    </div>
  )
}
