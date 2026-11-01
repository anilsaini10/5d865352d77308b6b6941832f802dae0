import { useCallback, useRef, useState } from 'react'
import { useToast } from '../../../context/ToastContext.jsx'
import { theme } from '../../../theme/theme.js'
import { formatDate } from '../../../utils/format.js'
import { billingApi } from './billing.api.js'
import { friendlyBillingError, isStaleError } from './billing.errors.js'
import { useEntitlements } from './EntitlementsContext.jsx'

let scriptPromise = null

/** Loads checkout.js once, on demand. Resolves false (and allows a retry later) if it can't load. */
function loadRazorpayScript() {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const el = document.querySelector('script[src*="checkout.razorpay.com"]')
    if (el) { el.onload = () => resolve(true); if (window.Razorpay) resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => resolve(true)
    s.onerror = () => { scriptPromise = null; s.remove(); resolve(false) }
    document.head.appendChild(s)
  })
  return scriptPromise
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Verify is idempotent, so a dropped connection is retried with backoff (1s, 2s, 4s) before giving up. */
async function verifyWithRetry(subscriptionId, resp, retries = 3) {
  const payload = {
    razorpay_order_id: resp.razorpay_order_id,
    razorpay_payment_id: resp.razorpay_payment_id,
    razorpay_signature: resp.razorpay_signature,
  }
  for (let i = 0; ; i++) {
    try {
      return await billingApi.razorpayVerify(subscriptionId, payload)
    } catch (err) {
      if (err.response || i >= retries) throw err
      await sleep(1000 * 2 ** i)
    }
  }
}

const paidMessage = (planName, sub) =>
  sub?.status === 'UPCOMING'
    ? `Paid · ${planName} starts ${formatDate(sub.startDate)}`
    : `Payment successful! ${planName}${sub?.endDate ? ` is active until ${formatDate(sub.endDate)}` : ' is now active'}.`

/**
 * One checkout flow for every "pay" button. `startCheckout(plan, planPriceId)`:
 *   – plan.action === 'COMPLETE_PAYMENT' with the same price → reuse mySubscription (the order is idempotent);
 *   – otherwise → subscribe first (the backend cancels any older unpaid attempt).
 * Success is only ever declared after razorpay-verify succeeds, never from the Checkout handler alone.
 */
export default function useRazorpayCheckout({ onSuccess, reloadPlans }) {
  const { notify } = useToast()
  const { reload: reloadEntitlements } = useEntitlements()
  const [busy, setBusy] = useState(false)
  const lockRef = useRef(false)

  const unlock = () => { setBusy(false); lockRef.current = false }
  const refresh = useCallback(() => { reloadPlans?.(); reloadEntitlements() }, [reloadPlans, reloadEntitlements])

  const startCheckout = useCallback(async (plan, planPriceId) => {
    if (lockRef.current) return
    lockRef.current = true
    setBusy(true)

    try {
      if (!(await loadRazorpayScript())) {
        notify("Couldn't load the payment gateway. Check your connection and try again.", 'error')
        unlock()
        return
      }

      const pending = plan.action === 'COMPLETE_PAYMENT' ? plan.mySubscription : null
      const reuse = pending && (planPriceId == null || pending.planPriceId == null || pending.planPriceId === planPriceId)
      const subscriptionId = reuse ? pending.id : (await billingApi.subscribe(planPriceId)).id
      const planName = plan.name ?? plan.plan?.name ?? 'Your plan'

      const order = await billingApi.razorpayOrder(subscriptionId)
      let paid = false

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Arise',
        description: order.description,
        prefill: order.prefill,
        theme: { color: theme.colors.board },
        handler: async (resp) => {
          paid = true
          try {
            const sub = await verifyWithRetry(subscriptionId, resp)
            notify(paidMessage(planName, sub), 'success')
            refresh()
            onSuccess?.(sub)
          } catch (err) {
            if (!err.response) {
              notify('We received your payment and are confirming it. Please refresh in a moment.', 'info')
            } else {
              notify(friendlyBillingError(err), 'error')
            }
            if (isStaleError(err) || !err.response) refresh()
          } finally {
            unlock()
          }
        },
        modal: {
          ondismiss: () => {
            if (paid) return // the handler owns the outcome
            notify('Payment cancelled.', 'info')
            refresh() // the unpaid attempt now shows as "Complete payment"
            unlock()
          },
        },
      })

      rzp.on('payment.failed', (resp) => {
        notify(resp?.error?.description || 'Payment failed. Please try again.', 'error')
      })

      rzp.open()
    } catch (err) {
      if (isStaleError(err)) refresh()
      notify(friendlyBillingError(err), 'error')
      unlock()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notify, refresh, reloadPlans, onSuccess])

  return { startCheckout, busy }
}
