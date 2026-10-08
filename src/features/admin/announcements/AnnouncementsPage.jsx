import { useState } from 'react'
import { Megaphone, Plus, Pencil, Trash2, CalendarClock, CalendarX2, CalendarDays, User } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import { AsyncContent, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, SearchInput, Tabs } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { getErrorMessage } from '../../../api/httpClient.js'
import { formatDate, formatDateTime, titleCase } from '../../../utils/format.js'
import { AUDIENCES, AUDIENCE_LABELS, ANNOUNCEMENT_STATUS_TONES } from '../constants.js'
import { announcementsApi } from './announcements.api.js'
import AnnouncementFormModal from './components/AnnouncementFormModal.jsx'

const PAGE_SIZE = 12
const AUDIENCE_FILTERS = [{ value: '', label: 'All' }, ...AUDIENCES]

function MetaItem({ icon: Icon, label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink/55">
      <Icon size={13} className="shrink-0 text-ink/40" />
      <span className="text-ink/45">{label}</span>
      <span className="font-medium text-ink/70">{value}</span>
    </span>
  )
}

function AnnouncementCard({ announcement: a, expanded, onToggle, onEdit, onDelete }) {
  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-ink leading-snug break-words">{a.title}</h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge tone={ANNOUNCEMENT_STATUS_TONES[a.status] ?? 'neutral'}>{titleCase(a.status)}</Badge>
            <Badge tone="info">{AUDIENCE_LABELS[a.audience] ?? a.audience}</Badge>
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <IconButton icon={Pencil} label="Edit announcement" tone="primary" onClick={onEdit} />
          <IconButton icon={Trash2} label="Delete announcement" tone="danger" onClick={onDelete} />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="text-left mt-3 text-sm text-ink/70 leading-relaxed whitespace-pre-line break-words hover:text-ink transition-colors"
      >
        <span className={expanded ? '' : 'line-clamp-3'}>{a.message}</span>
        <span className="block mt-1 text-xs font-semibold text-board">{expanded ? 'Show less' : 'Read more'}</span>
      </button>

      <div className="mt-4 pt-3 border-t border-line flex flex-col gap-1.5">
        <MetaItem icon={CalendarClock} label="Publish" value={a.publishAt ? formatDateTime(a.publishAt) : formatDateTime(a.createdAt)} />
        <MetaItem icon={CalendarX2} label="Expires" value={a.expiresAt ? formatDateTime(a.expiresAt) : 'Never'} />
        {a.eventDate && <MetaItem icon={CalendarDays} label="Event" value={formatDate(a.eventDate)} />}
        <MetaItem icon={User} label="By" value={a.createdBy?.name ?? '—'} />
      </div>
    </Card>
  )
}

export default function AnnouncementsPage() {
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [audience, setAudience] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(() => new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data, loading, error, reload } = useFetch(
    () => announcementsApi.list({ page, pageSize: PAGE_SIZE, search: debouncedSearch.trim(), audience }),
    [page, debouncedSearch, audience],
    { errorMessage: 'Could not load announcements.' },
  )

  const items = data?.items ?? []
  const filtered = !!(debouncedSearch.trim() || audience)

  const changeSearch = (v) => {
    setSearch(v)
    setPage(1)
  }
  const changeAudience = (v) => {
    setAudience(v)
    setPage(1)
  }

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (a) => {
    setEditing(a)
    setFormOpen(true)
  }

  const onSaved = (_saved, { isEdit }) => {
    notify(isEdit ? 'Announcement updated.' : 'Announcement published.', 'success')
    reload()
  }

  const confirmDelete = async () => {
    try {
      await announcementsApi.remove(deleting.id)
      notify('Announcement deleted.', 'success')
      if (items.length === 1 && page > 1) setPage((p) => p - 1)
      else reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete announcement.'), 'error')
    }
  }

  return (
    <AppShell
      title="Announcements"
      subtitle="Notices for teachers and parents"
      actions={
        <Button icon={Plus} onClick={openCreate}>
          <span className="hidden sm:inline">New announcement</span>
          <span className="sm:hidden">New</span>
        </Button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={changeSearch} placeholder="Search announcements..." />
        <div className="max-w-full overflow-x-auto">
          <Tabs options={AUDIENCE_FILTERS} value={audience} onChange={changeAudience} />
        </div>
      </div>

      <AsyncContent
        loading={loading}
        error={error}
        empty={items.length === 0}
        emptyState={
          <Card>
            <EmptyState
              icon={Megaphone}
              title={filtered ? 'No matching announcements' : 'No announcements yet'}
              message={filtered ? 'Try a different search or audience.' : 'Publish an announcement to notify teachers and parents.'}
              action={!filtered && <Button icon={Plus} onClick={openCreate}>New announcement</Button>}
            />
          </Card>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {items.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              expanded={expanded.has(a.id)}
              onToggle={() => toggle(a.id)}
              onEdit={() => openEdit(a)}
              onDelete={() => setDeleting(a)}
            />
          ))}
        </div>
      </AsyncContent>

      {!loading && !error && data && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}

      <AnnouncementFormModal open={formOpen} onClose={() => setFormOpen(false)} announcement={editing} onSaved={onSaved} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete announcement?"
        message={
          <>
            <strong className="text-ink">{deleting?.title}</strong> will be deleted and no longer shown to teachers or
            parents. Notifications already sent are not recalled.
          </>
        }
      />
    </AppShell>
  )
}
