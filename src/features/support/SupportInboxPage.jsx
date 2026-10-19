import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Inbox } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import Pagination from '../../components/Pagination.jsx'
import { AsyncContent, Badge, Card, EmptyState, SearchInput, Table, Tabs, THead, Th, Tr, Td, selectClass } from '../../components/ui.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { formatDateTime, timeAgo } from '../../utils/format.js'
import { schoolsApi } from '../schools/schools.api.js'
import { CATEGORIES, SENDER_ROLES, SUPPORT_CHANGED_EVENT, SUPPORT_STATUSES, statusMeta } from './support.constants.js'
import { supportInboxApi } from './supportInbox.api.js'
import SupportDetailDrawer from './SupportDetailDrawer.jsx'

const ALL = 'ALL'
const PAGE_SIZE = 20

export default function SupportInboxPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'OPEN' // default filter: Open
  const schoolId = params.get('school') || ''
  const role = params.get('role') || ''
  const category = params.get('category') || ''
  const q = params.get('q') || ''
  const page = Math.max(1, Number(params.get('page')) || 1)

  const [searchText, setSearchText] = useState(q)
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300)
  const [open, setOpen] = useState(null)

  // All filters live in the URL so a filtered view can be shared; changing one resets paging.
  const update = (patch, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params)
    Object.entries({ ...patch, ...(keepPage ? {} : { page: '' }) }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }

  useEffect(() => {
    if (debouncedSearch !== q) update({ q: debouncedSearch })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const { data: schoolsData } = useFetch(() => schoolsApi.list({ page: 1, pageSize: 100 }), [], { errorMessage: 'Could not load schools.' })
  const schools = schoolsData?.items ?? []

  const { data, setData, loading, error, reload } = useFetch(
    () => supportInboxApi.list({ page, pageSize: PAGE_SIZE, status: status === ALL ? undefined : status, schoolId, role, category, search: q }),
    [status, schoolId, role, category, q, page],
    { errorMessage: 'Could not load support queries.' }
  )
  const items = data?.items ?? []
  const counts = data?.statusCounts

  const notifyChanged = () => window.dispatchEvent(new Event(SUPPORT_CHANGED_EVENT))

  const onUpdated = (updated) => {
    setData((d) => d && { ...d, items: d.items.map((it) => (it.id === updated.id ? { ...it, ...updated } : it)) })
    reload() // statusCounts and the status filter may have changed
    notifyChanged()
  }
  const onGone = () => {
    setOpen(null)
    reload()
    notifyChanged()
  }

  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined
  const tabs = [
    ...SUPPORT_STATUSES.map((s) => ({ value: s.value, label: s.label, count: counts?.[s.value] })),
    { value: ALL, label: 'All', count: total },
  ]
  const hasFilters = !!(schoolId || role || category || q)

  return (
    <AppShell title="Support Inbox" subtitle="Help queries from every school — reply and update the status">
      <div className="overflow-x-auto mb-4">
        <Tabs options={tabs} value={status} onChange={(v) => update({ status: v === 'OPEN' ? '' : v })} />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        <SearchInput value={searchText} onChange={setSearchText} placeholder="Search by subject…" className="lg:max-w-xs" />
        <select className={`${selectClass} lg:w-56`} value={schoolId} onChange={(e) => update({ school: e.target.value })} aria-label="Filter by school">
          <option value="">All schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={`${selectClass} lg:w-40`} value={role} onChange={(e) => update({ role: e.target.value })} aria-label="Filter by sender role">
          <option value="">All senders</option>
          {SENDER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select className={`${selectClass} lg:w-48`} value={category} onChange={(e) => update({ category: e.target.value })} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading && !data}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={Inbox}
              title={hasFilters || status !== ALL ? 'No matching queries' : 'Inbox is empty'}
              message={hasFilters ? 'Try clearing a filter.' : status === 'OPEN' ? 'No open queries right now.' : 'Nothing here yet.'}
            />
          }
        >
          <Table className={loading ? 'opacity-60' : ''}>
            <THead>
              <Th>Subject</Th><Th>School</Th><Th>Sender</Th><Th>Category</Th><Th>Status</Th><Th>Created</Th><Th>Replied</Th>
            </THead>
            <tbody>
              {items.map((it) => {
                const meta = statusMeta(it.status)
                const roleLabel = SENDER_ROLES.find((r) => r.value === it.createdBy?.role)?.label
                return (
                  <Tr key={it.id} className="cursor-pointer hover:bg-line/20" onClick={() => setOpen(it)}>
                    <Td className="min-w-[200px] max-w-xs">
                      <p className={`truncate ${it.reply ? 'text-ink/80' : 'font-bold text-ink'}`}>{it.subject}</p>
                    </Td>
                    <Td className="whitespace-nowrap">{it.schoolName}</Td>
                    <Td className="whitespace-nowrap">
                      <span className="mr-2">{it.createdBy?.name}</span>
                      {roleLabel && <Badge tone="primary">{roleLabel}</Badge>}
                    </Td>
                    <Td className="whitespace-nowrap">{it.category || <span className="text-ink/35">—</span>}</Td>
                    <Td><Badge tone={meta.tone}>{meta.label}</Badge></Td>
                    <Td className="whitespace-nowrap" title={formatDateTime(it.createdAt)}>{timeAgo(it.createdAt)}</Td>
                    <Td>{it.reply ? <Check size={16} className="text-success" aria-label="Replied" /> : <span className="text-ink/35">—</span>}</Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={(p) => update({ page: p > 1 ? String(p) : '' }, { keepPage: true })} />}

      {open && <SupportDetailDrawer key={open.id} query={open} onClose={() => setOpen(null)} onUpdated={onUpdated} onGone={onGone} />}
    </AppShell>
  )
}
