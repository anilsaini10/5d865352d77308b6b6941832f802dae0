import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Button } from '../../../components/ui.jsx'
import PlanBrowser from './components/PlanBrowser.jsx'

export default function PlansPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  useEffect(() => { document.title = 'Plans & pricing' }, [])

  return (
    <AppShell
      title="Plans & pricing"
      subtitle="Choose a plan for your school or your own account"
      actions={<Button variant="secondary" icon={Receipt} onClick={() => navigate('/billing/subscriptions')}>My subscriptions</Button>}
    >
      <PlanBrowser initialOpenId={params.get('plan')} onDrawerClose={() => params.has('plan') && setParams({}, { replace: true })} />
    </AppShell>
  )
}
