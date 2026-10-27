import { useEffect, useState } from 'react'
import { Alert, Badge, Button, PageLoader } from '../../../../components/ui.jsx'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { formatDate, formatDateTime } from '../../../../utils/format.js'
import Drawer from './Drawer.jsx'
import { billingApi } from '../billing.api.js'
import { formatPaise, statusMeta, PAYMENT_TONES } from '../billing.constants.js'

function Row({ label, children }) {
  if (children == null || children === '') return null
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-ink/50 shrink-0">{label}</dt>
      <dd className="text-ink text-right break-words min-w-0">{children}</dd>
    </div>
  )
}

export default function SubscriptionDetailDrawer({ subscription, onClose, onCancel, onPay, payBusy }) {
  const [s, setS] = useState(subscription)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    billingApi.mySubscription(subscription.id)
      .then((full) => !cancelled && (setS(full), setError('')))
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Could not load subscription details.')))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [subscription.id])

  const meta = statusMeta(s.status)
  const canCancel = s.status === 'PENDING_PAYMENT'

  return (
    <Drawer
      label="Subscription details"
      onClose={onClose}
      header={
        <>
          <h2 className="font-display text-xl font-semibold text-ink truncate">{s.plan?.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {s.daysLeft != null && <span className="text-xs text-ink/55">{s.daysLeft} day{s.daysLeft === 1 ? '' : 's'} left</span>}
          </div>
        </>
      }
    >
          <Alert>{error}</Alert>
          {loading && <PageLoader className="py-2" />}

          {canCancel && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => onPay(s)} loading={payBusy}>Complete payment</Button>
              <Button variant="danger-ghost" onClick={() => onCancel(s)} disabled={payBusy}>Cancel subscription</Button>
            </div>
          )}

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1">Plan details</h3>
            <dl className="divide-y divide-line">
              <Row label="Plan">{s.plan?.name}</Row>
              <Row label="Type">{s.subscriberType === 'SCHOOL' ? 'For the school' : 'For my account'}</Row>
              <Row label="Price">{formatPaise(s.price?.amount)} / {s.price?.duration}</Row>
              <Row label="Start">{formatDate(s.startDate)}</Row>
              <Row label="End">{formatDate(s.endDate)}</Row>
              <Row label="Paid by">{s.paidBy?.name}</Row>
              <Row label="Created">{formatDateTime(s.createdAt)}</Row>
              <Row label="Activated">{s.activatedAt && formatDateTime(s.activatedAt)}</Row>
              <Row label="Cancelled">{s.cancelledAt && formatDateTime(s.cancelledAt)}</Row>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-2">Payments</h3>
            {s.payments?.length ? (
              <ul className="space-y-2">
                {s.payments.map((p) => (
                  <li key={p.id} className="rounded-xl border border-line px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink">{formatPaise(p.amount)}</span>
                      <Badge tone={PAYMENT_TONES[String(p.status).toUpperCase()] ?? 'neutral'}>
                        {String(p.status).replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                    </div>
                    <dl className="mt-1 divide-y divide-line/60">
                      <Row label="Gateway">{p.gateway}</Row>
                      <Row label="Reference">{p.reference}</Row>
                      <Row label="Order ID">{p.gatewayOrderId}</Row>
                      <Row label="Payment ID">{p.gatewayPaymentId}</Row>
                      <Row label="Paid at">{p.paidAt && formatDateTime(p.paidAt)}</Row>
                      <Row label="Created">{formatDateTime(p.createdAt)}</Row>
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink/50">No payments recorded.</p>
            )}
          </section>
    </Drawer>
  )
}
