import { useCallback, useRef, useState } from 'react'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'
import { billingApi } from './billing.api.js'
import { useEntitlements } from './EntitlementsContext.jsx'

const ERROR_MESSAGES = {
  INVALID_PAYMENT_SIGNATURE: 'Payment could not be verified.',
  SUBSCRIPTION_NOT_PENDING: 'This subscription is no longer awaiting payment.',
  AMOUNT_TOO_LOW: "This plan can't be paid online.",
  PLAN_NOT_AVAILABLE: 'This plan is no longer available.',
  ALREADY_COVERED_BY_SCHOOL: 'Your school already covers this plan.',
  PAYMENT_GATEWAY_NOT_CONFIGURED: 'Payments are temporarily unavailable, try again later.',
  PAYMENT_GATEWAY_ERROR: 'Payments are temporarily unavailable, try again later.',
  PAYMENT_GATEWAY_AUTH_FAILED: 'Payments are temporarily unavailable, try again later.',
}

let scriptPromise = null

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

function friendlyError(err) {
  const code = getErrorCode(err)
  return ERROR_MESSAGES[code] || getErrorMessage(err, 'Something went wrong. Please try again.')
}

export default function useRazorpayCheckout({ onSuccess, reloadPlans }) {
  const { notify } = useToast()
  const { reload: reloadEntitlements } = useEntitlements()
  const [busy, setBusy] = useState(false)
  const lockRef = useRef(false)

  const startCheckout = useCallback(async (plan, planPriceId) => {
    if (lockRef.current) return
    lockRef.current = true
    setBusy(true)

    try {
      const scriptOk = await loadRazorpayScript()
      if (!scriptOk) {
        notify("Couldn't load payment gateway. Check your connection.", 'error')
        return
      }

      let subscriptionId
      if (plan.action === 'COMPLETE_PAYMENT') {
        subscriptionId = plan.mySubscription.id
      } else {
        const sub = await billingApi.subscribe(planPriceId)
        subscriptionId = sub.id
      }

      const order = await billingApi.razorpayOrder(subscriptionId)

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Arise',
        description: order.description,
        prefill: order.prefill,
        theme: { color: '#4F46E5' },
        handler: async (resp) => {
          try {
            await verifyWithRetry(subscriptionId, resp)
            notify('Payment successful! Your plan is now active.', 'success')
            reloadPlans?.()
            reloadEntitlements()
            onSuccess?.()
          } catch (err) {
            const code = getErrorCode(err)
            if (code === 'SUBSCRIPTION_NOT_PENDING') {
              reloadPlans?.()
              reloadEntitlements()
            }
            notify(friendlyError(err), 'error')
          } finally {
            setBusy(false)
            lockRef.current = false
          }
        },
        modal: {
          ondismiss: () => {
            notify('Payment cancelled.', 'info')
            reloadPlans?.()
            setBusy(false)
            lockRef.current = false
          },
        },
      })

      rzp.on('payment.failed', (resp) => {
        notify(resp.error?.description || 'Payment failed. Please try again.', 'error')
      })

      rzp.open()
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'ALREADY_COVERED_BY_SCHOOL' || code === 'SUBSCRIPTION_NOT_PENDING') {
        reloadPlans?.()
        reloadEntitlements()
      }
      notify(friendlyError(err), 'error')
      setBusy(false)
      lockRef.current = false
    }
  }, [notify, reloadPlans, reloadEntitlements, onSuccess])

  return { startCheckout, busy }
}

async function verifyWithRetry(subscriptionId, resp, retries = 2) {
  const payload = {
    razorpay_order_id: resp.razorpay_order_id,
    razorpay_payment_id: resp.razorpay_payment_id,
    razorpay_signature: resp.razorpay_signature,
  }
  for (let i = 0; i <= retries; i++) {
    try {
      return await billingApi.razorpayVerify(subscriptionId, payload)
    } catch (err) {
      const isNetwork = !err.response
      if (!isNetwork || i === retries) throw err
      await new Promise((r) => setTimeout(r, 1500))
    }
  }
}
