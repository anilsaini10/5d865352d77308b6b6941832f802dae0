import { useState } from 'react'
import { CalendarDays, Pencil, Trash2 } from 'lucide-react'
import Pagination from '../../../../components/Pagination.jsx'
import { AsyncContent, Badge, Card, EmptyState, IconButton, SearchInput, Table, THead, Th, Tr, Td, selectClass } from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue.js'
import { AUDIENCES, AUDIENCE_LABELS, EVENT_TYPES } from '../../constants.js'
import { eventsApi } from '../events.api.js'
import { eventTypeMeta, formatEventRange } from './eventUtils.js'

const PAGE_SIZE = 20

export default function EventsList({ refreshKey, onOpenEvent, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [eventType, setEventType] = useState('')
  const [audience, setAudience] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error } = useFetch(
    () => eventsApi.list({ page, pageSize: PAGE_SIZE, search: debouncedSearch.trim(), eventType, audience }),
    [page, debouncedSearch, eventType, audience, refreshKey],
    { errorMessage: 'Could not load events.' },
  )

  const items = data?.items ?? []
  const filtered = !!(debouncedSearch.trim() || eventType || audience)

  const withReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  // Step back a page when the last row on a later page is deleted.
  if (!loading && data && items.length === 0 && page > 1) setPage(page - 1)

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={withReset(setSearch)} placeholder="Search events..." />
        <select className={`${selectClass} sm:w-44`} value={eventType} onChange={(e) => withReset(setEventType)(e.target.value)} aria-label="Event type">
          <option value="">All types</option>
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select className={`${selectClass} sm:w-44`} value={audience} onChange={(e) => withReset(setAudience)(e.target.value)} aria-label="Audience">
          <option value="">All audiences</option>
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      <Card>
        <AsyncContent
          loading={loading}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={CalendarDays}
              title={filtered ? 'No matching events' : 'No events yet'}
              message={filtered ? 'Try a different search or filter.' : 'Create an event to add it to the school calendar.'}
            />
          }
        >
          <Table>
            <THead>
              <Th>Event</Th>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Audience</Th>
              <Th>Added by</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {items.map((ev) => {
                const type = eventTypeMeta(ev.eventType)
                return (
                  <Tr key={ev.id}>
                    <Td className="min-w-[180px]">
                      <button type="button" onClick={() => onOpenEvent(ev)} className="text-left font-semibold text-ink hover:text-board">
                        {ev.title}
                      </button>
                      {ev.description && <p className="text-xs text-ink/50 mt-0.5 line-clamp-1">{ev.description}</p>}
                    </Td>
                    <Td className="whitespace-nowrap">{formatEventRange(ev)}</Td>
                    <Td><Badge tone={type.tone}>{type.label}</Badge></Td>
                    <Td className="whitespace-nowrap">{AUDIENCE_LABELS[ev.audience] ?? ev.audience}</Td>
                    <Td className="whitespace-nowrap">{ev.createdBy?.name ?? '—'}</Td>
                    <Td className="text-right whitespace-nowrap">
                      <IconButton icon={Pencil} label="Edit event" tone="primary" onClick={() => onEdit(ev)} />
                      <IconButton icon={Trash2} label="Delete event" tone="danger" onClick={() => onDelete(ev)} />
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {!loading && !error && data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
    </>
  )
}
