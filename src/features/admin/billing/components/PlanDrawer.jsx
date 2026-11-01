import { useState } from 'react'
import { CreditCard, Gift } from 'lucide-react'
import { Badge, Button } from '../../../../components/ui.jsx'
import { addDays, formatDay } from '../../../../utils/format.js'
import { formatPaise } from '../billing.constants.js'
import Drawer from './Drawer.jsx'
import PlanFeatureList from './PlanFeatureList.jsx'
import { TrialBadge } from './TrialInfo.jsx'

const PAY_VERB = { SUBSCRIBE: 'Subscribe', RENEW: 'Renew', COMPLETE_PAYMENT: 'Complete payment' }

/** Subscribe / renew / complete-payment drawer: features, trial note, duration options, Pay button. */
export default function PlanDrawer({ plan, onClose, onPay, busy }) {
  const prices = plan.prices ?? []
  const [priceId, setPriceId] = useState(() => (prices.some((p) => p.id === plan.mySubscription?.planPriceId) ? plan.mySubscription.planPriceId : prices[0]?.id ?? ''))
  const price = prices.find((p) => p.id === priceId)

  return (
    <Drawer
      label={`${plan.name} plan`}
      onClose={onClose}
      locked={busy}
      header={
        <>
          <h2 className="font-display text-xl font-semibold text-ink truncate">{plan.name}</h2>
          <p className="text-sm text-ink/55 mt-0.5">{PAY_VERB[plan.action] ?? 'Plan'} · {plan.scope === 'SCHOOL' ? 'for the whole school' : 'for your account'}</p>
        </>
      }
    >
      {plan.description && <p className="text-sm text-ink/65">{plan.description}</p>}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-2">What's included</h3>
        <PlanFeatureList plan={plan} />
      </section>

      {plan.trial && plan.trial.status !== 'ENDED' && (
        <section className="rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-ink space-y-1.5">
          <div className="flex items-center gap-2"><Gift size={16} className="text-info" /><TrialBadge plan={plan} /></div>
          <p className="text-ink/70">Free {formatDay(plan.trial.startDate)} – {formatDay(plan.trial.endDate)}, then you pay.</p>
          {plan.onTrial && <p className="text-ink/70">Paying now won't cut the trial short — the paid plan starts on {formatDay(addDays(plan.trial.endDate, 1))}.</p>}
        </section>
      )}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-2">Choose a duration</h3>
        {prices.length === 0 ? <p className="text-sm text-ink/50">This plan has no prices yet.</p> : (
          <div role="radiogroup" aria-label="Duration" className="grid sm:grid-cols-2 gap-2">
            {prices.map((p) => (
              <label key={p.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 cursor-pointer ${p.id === priceId ? 'border-board bg-board/10' : 'border-line bg-surface hover:border-board/30'}`}>
                <span className="flex items-center gap-2">
                  <input type="radio" name="plan-price" className="accent-board" checked={p.id === priceId} onChange={() => setPriceId(p.id)} disabled={busy} />
                  <span className="text-sm font-semibold text-ink">{p.duration ?? p.label}</span>
                </span>
                <span className="text-sm text-ink">{formatPaise(p.amount)}</span>
              </label>
            ))}
          </div>
        )}
        {plan.mySubscription?.status === 'PENDING_PAYMENT' && price && price.id !== plan.mySubscription.planPriceId && (
          <p className="text-xs text-ink/50 mt-2">A different duration starts a new checkout; your earlier unpaid attempt is cancelled.</p>
        )}
      </section>

      <Button icon={CreditCard} loading={busy} disabled={!price} onClick={() => onPay(plan, price.id)} className="w-full">
        Pay {price ? formatPaise(price.amount) : ''}
      </Button>
    </Drawer>
  )
}
