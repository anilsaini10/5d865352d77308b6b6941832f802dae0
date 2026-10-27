import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, Badge, Button, Card, PageLoader } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { plansApi } from '../subscription.api.js'
import { planTypeLabel, scopeLabel } from '../subscription.constants.js'
import { RoleChips, TrialBadge } from './PlanBadges.jsx'
import PlanFormModal from './PlanFormModal.jsx'
import PlanFeaturesSection from './PlanFeaturesSection.jsx'
import PlanPricesSection from './PlanPricesSection.jsx'

export default function PlanDetailPage() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const { data: plan, setData, loading, error } = useFetch(() => plansApi.get(planId), [planId], { errorMessage: 'Could not load the plan.' })

  useEffect(() => { if (plan) document.title = plan.name }, [plan])

  return (
    <AppShell
      title={plan?.name ?? 'Plan'}
      subtitle={plan?.code}
      onBack={() => navigate('/plans')}
      actions={plan && <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit plan</Button>}
    >
      {loading && !plan ? <PageLoader /> : error ? <Alert>{error}</Alert> : plan && (
        <div className="space-y-5 max-w-4xl">
          <Card className="p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge tone={plan.isActive ? 'success' : 'inactive'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
              <Badge tone={plan.scope === 'SCHOOL' ? 'info' : 'neutral'}>{scopeLabel(plan.scope)} plan</Badge>
              <Badge tone="primary">{planTypeLabel(plan.planType)}</Badge>
              <RoleChips roles={plan.targetRoles} />
              {plan.trial && <TrialBadge trial={plan.trial} />}
            </div>
            {plan.trial && <p className="text-sm text-ink/70 mb-3">Everyone this plan is offered to gets its features free during the trial, then must pay.</p>}
            {plan.description && <p className="text-sm text-ink/70 mb-3">{plan.description}</p>}
            <dl className="grid sm:grid-cols-3 gap-4 text-sm">
              <div><dt className="text-xs uppercase tracking-wide text-ink/45 font-semibold">Offered to</dt><dd className="text-ink mt-0.5">{plan.school?.name ?? 'All schools'}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-ink/45 font-semibold">Subscribers</dt><dd className="text-ink mt-0.5">{plan.liveSubscriptions} live / {plan.totalSubscriptions} total</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-ink/45 font-semibold">Sort order</dt><dd className="text-ink mt-0.5">{plan.sortOrder}</dd></div>
            </dl>
            <p className="text-xs text-ink/50 mt-4">
              {plan.scope === 'SCHOOL' ? 'School plan: the school admin buys it for the whole school.' : 'Self plan: a user buys it for themselves.'}{' '}
              {plan.planType === 'ADDON' ? 'Add-on: extra features on top of a base plan.' : 'Base: the main plan.'}
            </p>
          </Card>

          <PlanFeaturesSection plan={plan} onChange={setData} />
          <PlanPricesSection plan={plan} onChange={setData} />
        </div>
      )}

      {plan && <PlanFormModal open={editing} plan={plan} onClose={() => setEditing(false)} onSaved={(p) => setData(p)} />}
    </AppShell>
  )
}
