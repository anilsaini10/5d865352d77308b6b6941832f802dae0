import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button, Modal } from '../../../../components/ui.jsx'
import { useEntitlements } from '../EntitlementsContext.jsx'
import { LOCK_CTA } from '../billing.constants.js'

export default function LockedModal() {
  const navigate = useNavigate()
  const { lockedFeature, dismissLocked } = useEntitlements()

  if (!lockedFeature) return null

  const reason = lockedFeature.reason ?? 'NEVER_SUBSCRIBED'
  const cta = LOCK_CTA[reason] ?? LOCK_CTA.NEVER_SUBSCRIBED

  return (
    <Modal open onClose={dismissLocked} title="Feature locked">
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-ink/5 border border-line flex items-center justify-center mb-4">
          <Lock size={24} className="text-ink/30" />
        </div>
        <p className="text-sm text-ink/65 max-w-sm">
          {reason === 'NEVER_SUBSCRIBED' && 'This feature requires a subscription. Subscribe to a plan to unlock it.'}
          {reason === 'EXPIRED' && 'Your subscription has expired. Renew to regain access to this feature.'}
          {reason === 'PENDING_PAYMENT' && 'Your subscription is awaiting payment. Complete the payment to use this feature.'}
        </p>
        <div className="flex gap-2 mt-6">
          <Button variant="ghost" onClick={dismissLocked}>Close</Button>
          <Button
            onClick={() => {
              dismissLocked()
              navigate('/billing/plans')
            }}
          >
            {cta.label}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
