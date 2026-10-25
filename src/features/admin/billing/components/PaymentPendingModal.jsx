import { CreditCard, Clock } from 'lucide-react'
import { Button, Modal } from '../../../../components/ui.jsx'
import { formatPaise } from '../billing.constants.js'
import useRazorpayCheckout from '../useRazorpayCheckout.js'

export default function PaymentPendingModal({ subscription, onClose, onDone }) {
  const { startCheckout, busy } = useRazorpayCheckout({
    reloadPlans: onDone,
    onSuccess: onClose,
  })

  if (!subscription) return null

  const handlePay = () => {
    startCheckout({ action: 'COMPLETE_PAYMENT', mySubscription: subscription })
  }

  return (
    <Modal open onClose={onClose} title="Payment pending" subtitle={subscription.plan?.name ?? 'Subscription'}>
      <div className="space-y-5">
        <div className="flex items-center gap-4 p-4 bg-chalk/10 border border-chalk/30 rounded-xl">
          <div className="w-11 h-11 rounded-xl bg-chalk/20 flex items-center justify-center shrink-0">
            <Clock size={22} className="text-chalk-ink" />
          </div>
          <div>
            <p className="font-semibold text-ink">Awaiting payment</p>
            <p className="text-sm text-ink/55 mt-0.5">Complete payment to activate your subscription.</p>
          </div>
        </div>

        <dl className="divide-y divide-line text-sm">
          <div className="flex justify-between py-2">
            <dt className="text-ink/50">Plan</dt>
            <dd className="text-ink font-medium">{subscription.plan?.name}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink/50">Duration</dt>
            <dd className="text-ink font-medium">{subscription.price?.duration ?? subscription.price?.label}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink/50">Amount</dt>
            <dd className="text-ink font-semibold text-lg">{formatPaise(subscription.price?.amount)}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-ink/50">Subscription ID</dt>
            <dd className="text-ink font-mono text-xs">{subscription.id}</dd>
          </div>
        </dl>

        <div className="border-t border-line pt-4 space-y-3">
          <Button
            variant="primary"
            icon={CreditCard}
            loading={busy}
            onClick={handlePay}
            className="w-full"
          >
            Pay {formatPaise(subscription.price?.amount)}
          </Button>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
