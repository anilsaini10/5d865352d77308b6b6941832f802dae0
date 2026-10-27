import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button } from '../../../../components/ui.jsx'
import { LOCK_CTA, formatPaise, lockMessage } from '../billing.constants.js'

/** "This feature is locked" content, shared by the page-level gate and the 402 modal. */
export default function LockPanel({ name, reason, availableIn = [], onNavigate, compact = false }) {
  const navigate = useNavigate()
  const cta = LOCK_CTA[reason] ?? LOCK_CTA.NEVER_SUBSCRIBED
  const open = (planId) => {
    onNavigate?.()
    navigate(planId ? `/billing/plans?plan=${planId}` : '/billing/plans')
  }

  return (
    <div className={`flex flex-col items-center text-center px-6 ${compact ? 'py-2' : 'py-20 justify-center'}`}>
      <div className="w-14 h-14 rounded-2xl bg-ink/5 border border-line flex items-center justify-center mb-4">
        <Lock size={24} className="text-ink/30" />
      </div>
      <h3 className="font-display text-xl font-semibold text-ink">{lockMessage(reason, name)}</h3>
      {availableIn.length > 0 ? (
        <div className="mt-5 w-full max-w-sm space-y-2">
          <p className="text-xs text-ink/45">Included in</p>
          {availableIn.map((p) => (
            <div key={p.planId} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 text-left">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                {p.startingFrom && <p className="text-xs text-ink/45">from {formatPaise(p.startingFrom.amount)} / {p.startingFrom.duration}</p>}
              </div>
              <Button size="sm" onClick={() => open(p.planId)}>{cta.label}</Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5"><Button onClick={() => open()}>View plans</Button></div>
      )}
    </div>
  )
}
