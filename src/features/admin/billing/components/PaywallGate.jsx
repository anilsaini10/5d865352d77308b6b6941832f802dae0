import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Modal } from '../../../../components/ui.jsx'
import { useEntitlements } from '../EntitlementsContext.jsx'
import PlanBrowser from './PlanBrowser.jsx'

// Clicks inside these are never intercepted (the paywall itself, drawers/dialogs, Razorpay's overlay, logout).
const ALLOWED = '[role="dialog"], [role="alertdialog"], .razorpay-container, [data-paywall-allow]'

/**
 * When the school has plans but none currently gives this admin access (never subscribed, payment pending,
 * expired, trial over), the plan list opens after login and again on every click anywhere in the app,
 * until a payment succeeds. Billing pages themselves are left usable. Mount once inside <Router>.
 */
export default function PaywallGate() {
  const { paywalled } = useEntitlements()
  const { pathname } = useLocation()
  const onBilling = pathname.startsWith('/billing')
  const active = paywalled && !onBilling
  const [open, setOpen] = useState(false)

  // Opens on login / reload, and on every navigation while still unpaid.
  useEffect(() => { setOpen(active) }, [active, pathname])

  useEffect(() => {
    if (!active) return undefined
    const intercept = (e) => {
      if (e.target.closest?.(ALLOWED)) return
      e.preventDefault()
      e.stopPropagation()
      setOpen(true)
    }
    document.addEventListener('click', intercept, true)
    return () => document.removeEventListener('click', intercept, true)
  }, [active])

  if (!active || !open) return null
  return (
    <Modal open onClose={() => setOpen(false)} wide="xl" title="Choose a plan to continue" subtitle="A subscription is needed to use Arise. Pick a plan below — everything unlocks as soon as payment succeeds.">
      <PlanBrowser />
    </Modal>
  )
}
