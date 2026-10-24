import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import { AsyncContent, Badge, Button, Card, EmptyState, SearchInput, Table, Tabs, THead, Th, Tr, Td, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { formatDate } from '../../../utils/format.js'
import { schoolsApi } from '../../schools/schools.api.js'
import { plansApi, subscriptionsApi } from '../subscription.api.js'
import { ROLE_OPTIONS, SUBSCRIPTION_STATUSES, formatPaise, roleLabel, statusMeta } from '../subscription.constants.js'
import SubscriptionActionModal, { canActivate, canCancel } from './SubscriptionActions.jsx'
import SubscriptionDrawer from './SubscriptionDrawer.jsx'

const ALL = 'ALL'
const PAGE_SIZE = 20

export default function SubscriptionsPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ALL
  const schoolId = params.get('school') || ''
  const planId = params.get('plan') || ''
  const role = params.get('role') || ''
  const subscriberType = params.get('type') || ''
  const q = params.get('q') || ''
  const page = Math.max(1, Number(params.get('page')) || 1)

  const [searchText, setSearchText] = useState(q)
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300)
  const [open, setOpen] = useState(null)
  const [version, setVersion] = useState(0) // bumps the open drawer to refetch after an action
  const [action, setAction] = useState(null) // { mode, subscription }

  // Filters live in the URL so a filtered view can be shared; changing one resets paging.
  const update = (patch, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params)
    Object.entries({ ...patch, ...(keepPage ? {} : { page: '' }) }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }
  useEffect(() => {
    if (debouncedSearch !== q) update({ q: debouncedSearch })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])
  useEffect(() => { document.title = 'Subscriptions' }, [])

  const { data: schoolsData } = useFetch(() => schoolsApi.list({ page: 1, pageSize: 100 }), [], { errorMessage: 'Could not load schools.' })
  const { data: plans } = useFetch(() => plansApi.list(), [], { errorMessage: 'Could not load plans.' })
  const schools = schoolsData?.items ?? []

  const { data, loading, error, reload } = useFetch(
    () => subscriptionsApi.list({ page, pageSize: PAGE_SIZE, status: status === ALL ? undefined : status, schoolId, planId, role, subscriberType, search: q }),
    [status, schoolId, planId, role, subscriberType, q, page],
    { errorMessage: 'Could not load subscriptions.' }
  )
  const items = data?.items ?? []
  const counts = data?.statusCounts
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined
  const tabs = [{ value: ALL, label: 'All', count: total }, ...SUBSCRIPTION_STATUSES.map((s) => ({ value: s.value, label: s.label, count: counts?.[s.value] }))]
  const hasFilters = !!(schoolId || planId || role || subscriberType || q)

  const refresh = () => { reload(); setVersion((v) => v + 1) }
  const onDone = (updated) => { setOpen((o) => (o && o.id === updated.id ? updated : o)); refresh() }

  return (
    <AppShell title="Subscriptions" subtitle="Who has bought what — confirm offline payments and cancel access">
      <div className="overflow-x-auto mb-4"><Tabs options={tabs} value={status} onChange={(v) => update({ status: v === ALL ? '' : v })} /></div>

      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 mb-5">
        <SearchInput value={searchText} onChange={setSearchText} placeholder="Search buyer name, email or phone…" className="lg:max-w-xs" />
        <select className={`${selectClass} lg:w-48`} value={schoolId} onChange={(e) => update({ school: e.target.value })} aria-label="Filter by school">
          <option value="">All schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={`${selectClass} lg:w-48`} value={planId} onChange={(e) => update({ plan: e.target.value })} aria-label="Filter by plan">
          <option value="">All plans</option>
          {(plans ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
        </select>
        <select className={`${selectClass} lg:w-36`} value={role} onChange={(e) => update({ role: e.target.value })} aria-label="Filter by role">
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select className={`${selectClass} lg:w-40`} value={subscriberType} onChange={(e) => update({ type: e.target.value })} aria-label="Filter by subscriber type">
          <option value="">Users & schools</option>
          <option value="USER">Users</option>
          <option value="SCHOOL">Schools</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading && !data}
          error={error}
          empty={items.length === 0}
          emptyState={<EmptyState icon={CreditCard} title={hasFilters || status !== ALL ? 'No matching subscriptions' : 'No subscriptions yet'} message={hasFilters || status !== ALL ? 'Try clearing a filter or switching the status tab.' : 'They will appear here once someone buys a plan.'} />}
        >
          <Table className={loading ? 'opacity-60' : ''}>
            <THead><Th>Subscriber</Th><Th>Plan</Th><Th>Price</Th><Th>Status</Th><Th>Period</Th><Th /></THead>
            <tbody>
              {items.map((s) => {
                const meta = statusMeta(s.status)
                return (
                  <Tr key={s.id} className="cursor-pointer hover:bg-line/20" onClick={() => setOpen(s)}>
                    <Td className="min-w-[180px]">
                      <p className="font-semibold text-ink">{s.user?.name ?? s.school?.name}</p>
                      <p className="text-xs text-ink/50">{s.subscriberType === 'SCHOOL' ? 'School' : [roleLabel(s.role), s.school?.name].filter(Boolean).join(' · ')}</p>
                    </Td>
                    <Td className="whitespace-nowrap">{s.plan.name}<span className="block font-mono text-xs text-ink/40">{s.plan.code}</span></Td>
                    <Td className="whitespace-nowrap">{formatPaise(s.price.amount)}<span className="block text-xs text-ink/50">{s.price.duration}</span></Td>
                    <Td>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {s.daysLeft != null && <span className="block text-xs text-ink/50 mt-0.5">{s.daysLeft} day{s.daysLeft === 1 ? '' : 's'} left</span>}
                    </Td>
                    <Td className="whitespace-nowrap text-xs">{s.startDate ? `${formatDate(s.startDate)} – ${formatDate(s.endDate)}` : '—'}</Td>
                    <Td onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        {canActivate(s) && <Button size="sm" onClick={() => setAction({ mode: 'activate', subscription: s })}>Activate</Button>}
                        {canCancel(s) && <Button size="sm" variant="danger-ghost" onClick={() => setAction({ mode: 'cancel', subscription: s })}>Cancel</Button>}
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={(p) => update({ page: p > 1 ? String(p) : '' }, { keepPage: true })} />}

      {open && <SubscriptionDrawer key={open.id} subscription={open} version={version} onClose={() => setOpen(null)} onActivate={(s) => setAction({ mode: 'activate', subscription: s })} onCancel={(s) => setAction({ mode: 'cancel', subscription: s })} />}
      {action && <SubscriptionActionModal mode={action.mode} subscription={action.subscription} onClose={() => setAction(null)} onDone={onDone} onStale={refresh} />}
    </AppShell>
  )
}
