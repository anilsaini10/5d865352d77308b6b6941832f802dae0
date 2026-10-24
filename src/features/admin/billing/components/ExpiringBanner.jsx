import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../../../../components/ui.jsx'
import { useEntitlements } from '../EntitlementsContext.jsx'

export default function ExpiringBanner() {
  const navigate = useNavigate()
  const { expiringSchoolSubscription } = useEntitlements()

  if (!expiringSchoolSubscription) return null

  const days = expiringSchoolSubscription.daysLeft

  return (
    <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-2xl px-5 py-4 mb-6">
      <AlertTriangle size={20} className="text-warning shrink-0" />
      <p className="text-sm text-ink flex-1">
        <span className="font-semibold">School subscription expires in {days} day{days === 1 ? '' : 's'}</span>
        {' — '}Renew to keep features active for everyone.
      </p>
      <Button size="sm" onClick={() => navigate('/billing/plans')}>Renew</Button>
    </div>
  )
}
