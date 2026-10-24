import { useState } from 'react'
import { Clock, CreditCard } from 'lucide-react'
import { Alert, Button, Modal } from '../../../../components/ui.jsx'
import { useToast } from '../../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { billingApi } from '../billing.api.js'
import { formatPaise } from '../billing.constants.js'

export default function PaymentPendingModal({ subscription, onClose, onDone }) {
  const { notify } = useToast()
  const [paying, setPaying] = useState(false)

  if (!subscription) return null

  const handleDummyPay = async () => {
    setPaying(true)
    try {
      await billingApi.dummyPay(subscription.id)
      notify('Payment marked as complete.', 'success')
      onDone()
      onClose()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not process payment.'), 'error')
    } finally {
      setPaying(false)
    }
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
            <p className="text-sm text-ink/55 mt-0.5">Your subscription will be activated once payment is confirmed by Arise.</p>
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
            loading={paying}
            onClick={handleDummyPay}
            className="w-full"
          >
            Pay ₹0 (Test payment)
          </Button>
          <p className="text-xs text-ink/40 text-center">This is a test payment for development. Real payment gateway will be integrated later.</p>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
