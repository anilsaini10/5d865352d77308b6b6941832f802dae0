import { useNavigate } from 'react-router-dom'
import { Badge } from '../../../../components/ui.jsx'
import { useFeature } from '../EntitlementsContext.jsx'

/** Small tag beside a paid page's title: "Trial · N days left", or a "Renew" nudge when about to expire. */
export default function FeatureStatusTag({ featureKey }) {
  const navigate = useNavigate()
  const { status, daysLeft, hasAccess } = useFeature(featureKey)
  if (!hasAccess) return null
  const days = daysLeft != null ? ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : ''
  if (status === 'TRIAL') return <Badge tone="info">Trial{days}</Badge>
  if (status === 'EXPIRING_SOON') {
    return (
      <button type="button" onClick={() => navigate('/billing/plans')} className="rounded-full" aria-label="Renew your plan">
        <Badge tone="warning">Renew{days}</Badge>
      </button>
    )
  }
  return null
}
