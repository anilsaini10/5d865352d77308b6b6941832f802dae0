import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, EmptyState, PageLoader } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'
import { useEntitlements } from './EntitlementsContext.jsx'
import { billingApi } from './billing.api.js'
import PlanCard from './components/PlanCard.jsx'
import PaymentPendingModal from './components/PaymentPendingModal.jsx'

export default function PlansPage() {
  const { notify } = useToast()
  const { reload: reloadEntitlements } = useEntitlements()
  const { data: plans, loading, error, reload } = useFetch(() => billingApi.plans(), [], {
    errorMessage: 'Could not load plans.',
  })
  const [subscribing, setSubscribing] = useState(null)
  const [pendingSub, setPendingSub] = useState(null)

  useEffect(() => { document.title = 'Plans & pricing' }, [])

  const schoolPlans = (plans ?? []).filter((p) => p.scope === 'SCHOOL')
  const selfPlans = (plans ?? []).filter((p) => p.scope === 'SELF')
  const sortPlans = (list) => [...list].sort((a, b) => {
    if (a.planType === 'BASE' && b.planType !== 'BASE') return -1
    if (a.planType !== 'BASE' && b.planType === 'BASE') return 1
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  })

  const handleSubscribe = async (plan, planPriceId) => {
    if (plan.action === 'NONE') return
    setSubscribing(plan.id)
    try {
      const sub = await billingApi.subscribe(planPriceId)
      setPendingSub(sub)
      reload()
      reloadEntitlements()
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'ALREADY_COVERED_BY_SCHOOL') {
        notify('This plan is already covered by your school.', 'error')
      } else {
        notify(getErrorMessage(err, 'Could not subscribe.'), 'error')
      }
    } finally {
      setSubscribing(null)
    }
  }

  const handlePaymentDone = () => {
    reload()
    reloadEntitlements()
  }

  return (
    <AppShell title="Plans & pricing" subtitle="Choose a plan for your school or your own account">
      {loading ? (
        <PageLoader className="py-24" />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : !plans?.length ? (
        <EmptyState icon={CreditCard} title="No plans available" message="There are no plans available for your account right now." />
      ) : (
        <div className="space-y-10">
          {schoolPlans.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold text-ink mb-1">For the whole school</h2>
              <p className="text-sm text-ink/50 mb-4">These plans unlock features for parents, teachers and admins across your school.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortPlans(schoolPlans).map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onSubscribe={handleSubscribe}
                    loading={subscribing === plan.id}
                  />
                ))}
              </div>
            </section>
          )}

          {selfPlans.length > 0 && (
            <section>
              <h2 className="font-display text-lg font-semibold text-ink mb-1">For my account</h2>
              <p className="text-sm text-ink/50 mb-4">Plans that unlock features for your own admin account.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortPlans(selfPlans).map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onSubscribe={handleSubscribe}
                    loading={subscribing === plan.id}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <PaymentPendingModal
        subscription={pendingSub}
        onClose={() => setPendingSub(null)}
        onDone={handlePaymentDone}
      />
    </AppShell>
  )
}
