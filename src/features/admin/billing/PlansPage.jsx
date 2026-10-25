import { useEffect } from 'react'
import { CreditCard } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, EmptyState, PageLoader } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { billingApi } from './billing.api.js'
import PlanCard from './components/PlanCard.jsx'
import useRazorpayCheckout from './useRazorpayCheckout.js'

export default function PlansPage() {
  const { data: plans, loading, error, reload } = useFetch(() => billingApi.plans(), [], {
    errorMessage: 'Could not load plans.',
  })

  const { startCheckout, busy } = useRazorpayCheckout({ reloadPlans: reload })

  useEffect(() => { document.title = 'Plans & pricing' }, [])

  const schoolPlans = (plans ?? []).filter((p) => p.scope === 'SCHOOL')
  const selfPlans = (plans ?? []).filter((p) => p.scope === 'SELF')
  const sortPlans = (list) => [...list].sort((a, b) => {
    if (a.planType === 'BASE' && b.planType !== 'BASE') return -1
    if (a.planType !== 'BASE' && b.planType === 'BASE') return 1
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  })

  const handleSubscribe = (plan, planPriceId) => {
    if (plan.action === 'NONE') return
    startCheckout(plan, planPriceId)
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
                    loading={busy}
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
                    loading={busy}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  )
}
