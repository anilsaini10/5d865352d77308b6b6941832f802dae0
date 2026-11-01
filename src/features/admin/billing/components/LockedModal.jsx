import { Modal } from '../../../../components/ui.jsx'
import { useEntitlements } from '../EntitlementsContext.jsx'
import LockPanel from './LockPanel.jsx'

/** Shown when any API call answers 402 PAYMENT_REQUIRED. */
export default function LockedModal() {
  const { lockedFeature, dismissLocked, getFeature } = useEntitlements()
  if (!lockedFeature) return null

  const feat = lockedFeature.feature ? getFeature(lockedFeature.feature) : null
  return (
    <Modal open onClose={dismissLocked} title="Feature locked">
      <LockPanel
        compact
        name={feat?.name}
        reason={lockedFeature.reason ?? feat?.reason ?? 'NEVER_SUBSCRIBED'}
        availableIn={feat?.availableIn}
        onNavigate={dismissLocked}
      />
    </Modal>
  )
}
