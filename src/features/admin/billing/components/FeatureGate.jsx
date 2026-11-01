import { useFeature } from '../EntitlementsContext.jsx'
import LockPanel from './LockPanel.jsx'

/** Renders `children` when the feature is unlocked, otherwise the lock panel. */
export default function FeatureGate({ featureKey, children }) {
  const { hasAccess, name, reason, availableIn } = useFeature(featureKey)
  if (hasAccess) return children
  return <LockPanel name={name} reason={reason ?? 'NEVER_SUBSCRIBED'} availableIn={availableIn} />
}
