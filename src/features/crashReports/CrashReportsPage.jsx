import { useEffect, useRef, useState } from 'react'
import { Bug, Skull, ShieldAlert, CalendarClock, RotateCcw, Smartphone } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import Pagination from '../../components/Pagination.jsx'
import { AsyncContent, Badge, Button, Card, EmptyState, SearchInput, Table, Th, THead, Td, Tr } from '../../components/ui.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { formatDateTime, formatNumber } from '../../utils/format.js'
import { crashReportsApi } from './crashReports.api.js'
import CrashDetailModal from './CrashDetailModal.jsx'

const PAGE_SIZE = 20

const PLATFORM_OPTIONS = [
  { value: '', label: 'All platforms' },
  { value: 'ANDROID', label: 'Android' },
  { value: 'IOS', label: 'iOS' },
  { value: 'WEB', label: 'Web' },
]

const FATAL_OPTIONS = [
  { value: '', label: 'All severity' },
  { value: 'true', label: 'Fatal only' },
  { value: 'false', label: 'Non-fatal only' },
]

const platformTone = (p) => {
  if (p === 'ANDROID') return 'success'
  if (p === 'IOS') return 'info'
  return 'neutral'
}

function StatCard({ icon: Icon, label, value, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-surface border-line',
    danger: 'bg-coral/5 border-coral/20',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-chalk/10 border-chalk/30',
  }
  const iconTones = {
    neutral: 'text-ink/40',
    danger: 'text-coral',
    success: 'text-success',
    warning: 'text-chalk-ink',
  }
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${tones[tone]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={iconTones[tone]} />
        <span className="text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</span>
      </div>
      <p className="text-2xl font-display font-bold text-ink">{formatNumber(value ?? 0)}</p>
    </div>
  )
}

function PlatformPills({ byPlatform }) {
  if (!byPlatform?.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {byPlatform.map(({ platform, count }) => (
        <span key={platform ?? 'unknown'} className="inline-flex items-center gap-1 rounded-full bg-line/50 px-2.5 py-0.5 text-xs font-medium text-ink/60">
          <Smartphone size={11} />
          {platform ?? 'Unknown'}: {count}
        </span>
      ))}
    </div>
  )
}

const selectClass = 'rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-board focus:ring-2 focus:ring-board/15 outline-none transition-shadow'

export default function CrashReportsPage() {
  const [page, setPage] = useState(1)
  const [platform, setPlatform] = useState('')
  const [isFatal, setIsFatal] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const debounceRef = useRef(null)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  const { data: stats } = useFetch(
    () => crashReportsApi.stats(),
    [],
    { errorMessage: 'Could not load stats.' },
  )

  const { data, loading, error } = useFetch(
    () => crashReportsApi.list({ page, pageSize: PAGE_SIZE, platform: platform || undefined, isFatal: isFatal || undefined, search: debouncedSearch || undefined }),
    [page, platform, isFatal, debouncedSearch],
    { errorMessage: 'Could not load crash reports.' },
  )

  const items = data?.items ?? []

  const hasFilters = platform || isFatal || search
  const resetFilters = () => {
    setPlatform('')
    setIsFatal('')
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
  }

  const onFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  return (
    <AppShell title="Crash Reports" subtitle="Monitor app crashes across platforms">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard icon={Bug} label="Total Crashes" value={stats?.total} />
        <StatCard icon={Skull} label="Fatal" value={stats?.fatal} tone="danger" />
        <StatCard icon={ShieldAlert} label="Non-Fatal" value={stats?.nonFatal} tone="warning" />
        <StatCard icon={CalendarClock} label="Today" value={stats?.today} tone="success" />
      </div>

      {stats?.byPlatform?.length > 0 && (
        <PlatformPills byPlatform={stats.byPlatform} />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 mt-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search errors, devices..." className="max-w-xs flex-1" />
        <select value={platform} onChange={onFilterChange(setPlatform)} className={selectClass}>
          {PLATFORM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={isFatal} onChange={onFilterChange(setIsFatal)} className={selectClass}>
          {FATAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hasFilters && (
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={resetFilters}>Reset</Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <AsyncContent
          loading={loading}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={Bug}
              title={hasFilters ? 'No matching crashes' : 'No crash reports yet'}
              message={hasFilters ? 'Try adjusting your filters.' : 'Crash reports from the mobile app will appear here.'}
            />
          }
        >
          <Table>
            <THead>
              <Th>Error</Th>
              <Th>User</Th>
              <Th className="hidden md:table-cell">Device</Th>
              <Th>Platform</Th>
              <Th>Fatal</Th>
              <Th className="hidden sm:table-cell">Crashed At</Th>
              <Th className="hidden lg:table-cell">Version</Th>
            </THead>
            <tbody>
              {items.map((item) => (
                <Tr
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className="hover:bg-line/25 cursor-pointer transition-colors"
                >
                  <Td>
                    <p className="text-ink font-medium truncate max-w-[240px]" title={item.errorMessage}>
                      {item.errorMessage?.length > 60 ? item.errorMessage.slice(0, 60) + '...' : item.errorMessage}
                    </p>
                    {item.errorType && <Badge tone="neutral">{item.errorType}</Badge>}
                  </Td>
                  <Td>
                    {item.user ? (
                      <>
                        <p className="text-ink/80 font-medium">{item.user.name}</p>
                        <p className="text-xs text-ink/45">{item.user.role}</p>
                      </>
                    ) : (
                      <span className="text-ink/40">—</span>
                    )}
                  </Td>
                  <Td className="hidden md:table-cell">
                    {item.deviceModel ? (
                      <>
                        <p className="text-ink/70">{item.deviceModel}</p>
                        <p className="text-xs text-ink/40">{item.osVersion}</p>
                      </>
                    ) : (
                      <span className="text-ink/40">—</span>
                    )}
                  </Td>
                  <Td>
                    {item.platform ? <Badge tone={platformTone(item.platform)}>{item.platform}</Badge> : '—'}
                  </Td>
                  <Td>
                    <Badge tone={item.isFatal ? 'danger' : 'success'}>{item.isFatal ? 'Fatal' : 'Non-fatal'}</Badge>
                  </Td>
                  <Td className="hidden sm:table-cell whitespace-nowrap">
                    {formatDateTime(item.crashedAt || item.createdAt)}
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <span className="font-mono text-xs">{item.appVersion || '—'}</span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {!loading && !error && data && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}

      <CrashDetailModal
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        crashId={selectedId}
      />
    </AppShell>
  )
}
