import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Alert, Badge, Button, PageLoader } from '../../../components/ui.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { formatDate, formatDateTime } from '../../../utils/format.js'
import { subscriptionsApi } from '../subscription.api.js'
import { formatPaise, planTypeLabel, roleLabel, scopeLabel, statusMeta } from '../subscription.constants.js'
import { canActivate, canCancel } from './SubscriptionActions.jsx'

const PAYMENT_TONES = { SUCCESS: 'success', PAID: 'success', CAPTURED: 'success', FAILED: 'danger', PENDING: 'amber', CREATED: 'amber' }

function Row({ label, children }) {
  if (children == null || children === '') return null
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-ink/50 shrink-0">{label}</dt>
      <dd className="text-ink text-right break-words min-w-0">{children}</dd>
    </div>
  )
}
const person = (p) => p && (
  <>
    {p.name}
    {(p.email || p.phone) && <span className="block text-xs text-ink/50">{[p.email, p.phone].filter(Boolean).join(' · ')}</span>}
  </>
)

/** Detail drawer with payment history. `subscription` is the list row; the full record is fetched on open. */
export default function SubscriptionDrawer({ subscription, version, onClose, onActivate, onCancel }) {
  const [s, setS] = useState(subscription)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Refetch on open and whenever the parent bumps `version` after an action.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    subscriptionsApi.get(subscription.id)
      .then((full) => !cancelled && (setS(full), setError('')))
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Could not load the subscription.')))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [subscription.id, version])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const meta = statusMeta(s.status)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label="Subscription details" className="relative w-full max-w-xl h-full bg-paper border-l border-line shadow-pop overflow-y-auto animate-rise">
        <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-line px-6 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold text-ink truncate">{s.plan.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone={meta.tone}>{meta.label}</Badge>
              {s.daysLeft != null && <span className="text-xs text-ink/55">{s.daysLeft} day{s.daysLeft === 1 ? '' : 's'} left</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-ink/50 hover:text-ink hover:bg-line/40 rounded-full p-1.5" aria-label="Close"><X size={18} /></button>
        </header>

        <div className="px-6 py-5 space-y-6">
          <Alert>{error}</Alert>
          {loading && <PageLoader className="py-2" />}

          {(canActivate(s) || canCancel(s)) && (
            <div className="flex flex-wrap gap-2">
              {canActivate(s) && <Button onClick={() => onActivate(s)}>Mark as paid / Activate</Button>}
              {canCancel(s) && <Button variant="danger-ghost" onClick={() => onCancel(s)}>Cancel subscription</Button>}
            </div>
          )}

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1">Subscriber</h3>
            <dl className="divide-y divide-line">
              <Row label="Type">{s.subscriberType === 'SCHOOL' ? 'School' : 'User'}</Row>
              <Row label="Role">{roleLabel(s.role)}</Row>
              <Row label="User">{person(s.user)}</Row>
              <Row label="School">{s.school?.name}</Row>
              <Row label="Paid by">{person(s.paidBy)}</Row>
              <Row label="Activated by">{s.activatedBy?.name}</Row>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1">Plan</h3>
            <dl className="divide-y divide-line">
              <Row label="Plan">{s.plan.name} <span className="font-mono text-xs text-ink/40">{s.plan.code}</span></Row>
              <Row label="Scope · type">{scopeLabel(s.plan.scope)} · {planTypeLabel(s.plan.planType)}</Row>
              <Row label="Price">{formatPaise(s.price.amount)} / {s.price.duration}</Row>
              <Row label="Start">{formatDate(s.startDate)}</Row>
              <Row label="End">{formatDate(s.endDate)}</Row>
              <Row label="Created">{formatDateTime(s.createdAt)}</Row>
              <Row label="Activated">{s.activatedAt && formatDateTime(s.activatedAt)}</Row>
              <Row label="Cancelled">{s.cancelledAt && formatDateTime(s.cancelledAt)}</Row>
              <Row label="Note">{s.note}</Row>
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
                      <Badge tone={PAYMENT_TONES[String(p.status).toUpperCase()] ?? 'neutral'}>{String(p.status).replace(/_/g, ' ').toLowerCase()}</Badge>
                    </div>
                    <dl className="mt-1 divide-y divide-line/60">
                      <Row label="Gateway">{p.gateway}</Row>
                      <Row label="Reference">{p.reference}</Row>
                      <Row label="Order id">{p.gatewayOrderId}</Row>
                      <Row label="Payment id">{p.gatewayPaymentId}</Row>
                      <Row label="Paid at">{p.paidAt && formatDateTime(p.paidAt)}</Row>
                      <Row label="Created">{formatDateTime(p.createdAt)}</Row>
                    </dl>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink/50">No payments recorded.</p>}
          </section>
        </div>
      </aside>
    </div>
  )
}
