import { useEffect, useState } from 'react'
import { Alert, Field, FormActions, Modal, inputClass } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { subscriptionsApi } from '../subscription.api.js'
import { describeError } from '../subscription.errors.js'
import { formatPaise } from '../subscription.constants.js'
import { getErrorCode } from '../../../api/httpClient.js'

export const canActivate = (s) => s.status === 'PENDING_PAYMENT' || s.status === 'PAYMENT_FAILED'
export const canCancel = (s) => s.status !== 'CANCELLED'

const buyerName = (s) => s.user?.name ?? s.school?.name ?? 'this subscriber'

/**
 * Shared modal for both actions. Gateway isn't integrated yet, so "Activate" is how the super admin confirms an offline payment.
 * On a 409 (state changed elsewhere) the parent is asked to refresh via `onStale`.
 */
export default function SubscriptionActionModal({ mode, subscription, onClose, onDone, onStale }) {
  const { notify } = useToast()
  const isActivate = mode === 'activate'
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    setReference('')
    setNote('')
    setServerError('')
  }, [mode, subscription?.id])

  if (!subscription) return null

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (note.length > 500 || reference.length > 100) {
      setServerError(note.length > 500 ? 'Note can be at most 500 characters.' : 'Reference can be at most 100 characters.')
      return
    }
    setSubmitting(true)
    try {
      const updated = isActivate
        ? await subscriptionsApi.activate(subscription.id, { reference, note })
        : await subscriptionsApi.cancel(subscription.id, { note })
      notify(isActivate ? (updated.status === 'UPCOMING' ? 'Payment confirmed — the renewal will start when the current plan ends.' : 'Subscription activated.') : 'Subscription cancelled.', 'success')
      onDone(updated)
      onClose()
    } catch (err) {
      const message = describeError(err, isActivate ? 'Could not activate the subscription.' : 'Could not cancel the subscription.')
      if (['SUBSCRIPTION_NOT_PENDING', 'SUBSCRIPTION_ALREADY_CANCELLED'].includes(getErrorCode(err))) {
        notify(message, 'error')
        onStale()
        onClose()
      } else {
        setServerError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={submitting ? () => {} : onClose}
      title={isActivate ? 'Mark as paid & activate' : 'Cancel subscription'}
      subtitle={`${subscription.plan.name} · ${buyerName(subscription)} · ${formatPaise(subscription.price.amount)} / ${subscription.price.duration}`}
    >
      <form onSubmit={submit} className="space-y-4">
        {isActivate ? (
          <>
            <Alert tone="info">Online payments aren't connected yet — use this to confirm a payment received offline. If the same plan is still running, this renewal starts when it ends.</Alert>
            <Field label="Reference" hint="Optional — UTR / cheque number.">
              <input className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} autoFocus />
            </Field>
          </>
        ) : (
          <Alert tone="warning">Access stops immediately. No refund is recorded.</Alert>
        )}
        <Field label="Note" hint="Optional">
          <textarea className={inputClass} rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} autoFocus={!isActivate} />
        </Field>
        <Alert>{serverError}</Alert>
        <FormActions onCancel={onClose} cancelLabel={isActivate ? 'Cancel' : 'Keep subscription'} submitting={submitting} submitLabel={isActivate ? 'Confirm payment' : 'Cancel subscription'} />
      </form>
    </Modal>
  )
}
