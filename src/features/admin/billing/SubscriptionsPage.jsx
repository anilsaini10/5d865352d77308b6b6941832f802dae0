import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import { AsyncContent, Badge, Button, Card, ConfirmDialog, EmptyState, Table, Tabs, THead, Th, Tr, Td } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { formatDate } from '../../../utils/format.js'
import { useEntitlements } from './EntitlementsContext.jsx'
import { billingApi } from './billing.api.js'
import { formatPaise, statusMeta } from './billing.constants.js'
import { friendlyBillingError } from './billing.errors.js'
import useRazorpayCheckout from './useRazorpayCheckout.js'
import SubscriptionDetailDrawer from './components/SubscriptionDetailDrawer.jsx'

const ALL = ''
const PAGE_SIZE = 10

export default function SubscriptionsPage() {
  const { notify } = useToast()
  const { reload: reloadEntitlements } = useEntitlements()
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)

  useEffect(() => { document.title = 'My subscriptions' }, [])
  useEffect(() => { setPage(1) }, [status])

  const { data, loading, error, reload } = useFetch(
    () => billingApi.mySubscriptions({ page, pageSize: PAGE_SIZE, status: status || undefined }),
    [page, status],
    { errorMessage: 'Could not load subscriptions.' },
  )
  const items = data?.items ?? []

  const tabs = [
    { value: ALL, label: 'All' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'PENDING_PAYMENT', label: 'Pending' },
    { value: 'EXPIRED', label: 'Expired' },
  ]

  const { startCheckout, busy: payBusy } = useRazorpayCheckout({ reloadPlans: reload, onSuccess: () => setOpen(null) })
  const pay = (s) => startCheckout({ action: 'COMPLETE_PAYMENT', mySubscription: s, name: s.plan?.name }, s.planPriceId ?? s.price?.id)

  const handleCancel = async () => {
    try {
      await billingApi.cancelSubscription(cancelTarget.id)
      notify('Subscription cancelled.', 'success')
      reload()
      reloadEntitlements()
      setOpen(null)
    } catch (err) {
      notify(friendlyBillingError(err, 'Could not cancel subscription.'), 'error')
      reload()
    }
  }

  return (
    <AppShell title="My subscriptions" subtitle="Billing history and subscription management">
      <div className="overflow-x-auto mb-4">
        <Tabs options={tabs} value={status} onChange={setStatus} />
      </div>

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading && !data}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={Receipt}
              title={status ? 'No matching subscriptions' : 'No subscriptions yet'}
              message={status ? 'Try switching to a different status tab.' : 'Subscribe to a plan to see your billing history here.'}
            />
          }
        >
          <Table className={loading ? 'opacity-60' : ''}>
            <THead>
              <Th>Plan</Th>
              <Th>For</Th>
              <Th>Duration</Th>
              <Th>Amount</Th>
              <Th>Period</Th>
              <Th>Status</Th>
              <Th>Paid by</Th>
              <Th />
            </THead>
            <tbody>
              {items.map((s) => {
                const meta = statusMeta(s.status)
                const canCancel = s.status === 'PENDING_PAYMENT'
                return (
                  <Tr key={s.id} className="cursor-pointer hover:bg-line/20" onClick={() => setOpen(s)}>
                    <Td className="whitespace-nowrap font-semibold text-ink">{s.plan.name}</Td>
                    <Td className="whitespace-nowrap text-xs">{s.subscriberType === 'SCHOOL' ? 'School' : 'Me'}</Td>
                    <Td className="whitespace-nowrap">{s.price.duration}</Td>
                    <Td className="whitespace-nowrap">{formatPaise(s.price.amount)}</Td>
                    <Td className="whitespace-nowrap text-xs">
                      {s.startDate ? `${formatDate(s.startDate)} – ${formatDate(s.endDate)}` : '—'}
                    </Td>
                    <Td>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {s.daysLeft != null && <span className="block text-xs text-ink/50 mt-0.5">{s.daysLeft}d left</span>}
                    </Td>
                    <Td className="whitespace-nowrap text-xs">{s.paidBy?.name ?? '—'}</Td>
                    <Td onClick={(e) => e.stopPropagation()}>
                      {canCancel && (
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Button size="sm" onClick={() => pay(s)} disabled={payBusy}>Complete payment</Button>
                          <Button size="sm" variant="danger-ghost" onClick={() => setCancelTarget(s)} disabled={payBusy}>Cancel</Button>
                        </div>
                      )}
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          onChange={setPage}
        />
      )}

      {open && (
        <SubscriptionDetailDrawer
          key={open.id}
          subscription={open}
          onClose={() => setOpen(null)}
          onCancel={(s) => { setCancelTarget(s); setOpen(null) }}
          onPay={pay}
          payBusy={payBusy}
        />
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel subscription?"
        message="This will cancel the pending subscription. You can subscribe again later."
        confirmLabel="Cancel subscription"
      />
    </AppShell>
  )
}
