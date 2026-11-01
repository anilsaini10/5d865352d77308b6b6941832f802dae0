import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CreditCard } from 'lucide-react'
import { Alert, ConfirmDialog, EmptyState, PageLoader } from '../../../../components/ui.jsx'
import { useToast } from '../../../../context/ToastContext.jsx'
import { billingApi } from '../billing.api.js'
import { friendlyBillingError } from '../billing.errors.js'
import { useEntitlements } from '../EntitlementsContext.jsx'
import useRazorpayCheckout from '../useRazorpayCheckout.js'
import PlanCard from './PlanCard.jsx'
import PlanDrawer from './PlanDrawer.jsx'

// The backend already orders plans (BASE first, then ADDON) — keep that order within each section.
const SECTIONS = [
  { key: 'school', title: 'For the whole school', hint: 'Unlocks features for teachers and parents across your school, as listed for each role.', pick: (p) => p.scope === 'SCHOOL' },
  { key: 'self', title: 'For your account', hint: 'Plans that unlock features for your own admin account.', pick: (p) => p.scope !== 'SCHOOL' && p.planType !== 'ADDON' },
  { key: 'addons', title: 'Add-ons', hint: 'Extra features on top of a base plan.', pick: (p) => p.scope !== 'SCHOOL' && p.planType === 'ADDON' },
]

/** The sectioned plan grid + subscribe drawer + cancel-pending flow. Used by the Plans page and the paywall modal. */
export default function PlanBrowser({ initialOpenId = null, onDrawerClose }) {
  const { notify } = useToast()
  const { plans, plansError, reload } = useEntitlements()
  const [openId, setOpenId] = useState(initialOpenId)
  const [toCancel, setToCancel] = useState(null)

  const closeDrawer = () => { setOpenId(null); onDrawerClose?.() }
  const { startCheckout, busy } = useRazorpayCheckout({ onSuccess: closeDrawer })
  const openPlan = plans?.find((p) => p.id === openId && p.action !== 'NONE')

  const cancelPending = async () => {
    try {
      await billingApi.cancelSubscription(toCancel.mySubscription.id)
      notify('Payment cancelled.', 'success')
    } catch (err) {
      notify(friendlyBillingError(err, 'Could not cancel the payment.'), 'error')
    }
    reload()
  }

  if (!plans) return plansError ? <Alert>{plansError}</Alert> : <PageLoader className="py-24" />
  if (!plans.length) return <EmptyState icon={CreditCard} title="No plans available" message="There are no plans available for your account right now." />

  return (
    <>
      <div className="space-y-10">
        {SECTIONS.map(({ key, title, hint, pick }) => {
          const list = plans.filter(pick)
          if (!list.length) return null
          return (
            <section key={key}>
              <h2 className="font-display text-lg font-semibold text-ink mb-1">{title}</h2>
              <p className="text-sm text-ink/50 mb-4">{hint}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {list.map((plan) => <PlanCard key={plan.id} plan={plan} onOpen={(p) => setOpenId(p.id)} onCancel={setToCancel} />)}
              </div>
            </section>
          )
        })}
      </div>

      {openPlan && <PlanDrawer key={openPlan.id} plan={openPlan} onClose={closeDrawer} onPay={startCheckout} busy={busy} />}
      {createPortal(
        <ConfirmDialog open={!!toCancel} onClose={() => setToCancel(null)} onConfirm={cancelPending} title="Cancel pending payment?"
          message={<>Cancel the unpaid subscription for <strong>{toCancel?.name}</strong>? You can subscribe again later.</>} confirmLabel="Cancel payment" />,
        document.body,
      )}
    </>
  )
}
