import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Check, Send } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import { AsyncContent, Badge, Button, Card, EmptyState, Tabs } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { getErrorMessage } from '../../../api/httpClient.js'
import { formatDateTime, titleCase } from '../../../utils/format.js'
import { notificationsApi } from './notifications.api.js'
import SendNotificationModal from './components/SendNotificationModal.jsx'
import {
  NOTIFICATIONS_CHANGED,
  announceNotificationsChanged,
  isUnread,
  notificationBody,
  notificationTime,
  notificationTitle,
  timeAgo,
} from './components/notificationUtils.js'

const PAGE_SIZE = 20
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
]

export default function NotificationsPage() {
  const { notify } = useToast()
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sendOpen, setSendOpen] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const { data, setData, loading, error, reload } = useFetch(
    () => notificationsApi.list({ page, pageSize: PAGE_SIZE, isRead: filter === 'unread' ? 'false' : undefined }),
    [page, filter],
    { errorMessage: 'Could not load notifications.' },
  )

  // Marking read from the header bell should show up here too.
  useEffect(() => {
    const onChange = (e) => e.detail?.source !== 'page' && reload()
    window.addEventListener(NOTIFICATIONS_CHANGED, onChange)
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, onChange)
  }, [reload])

  const items = data?.items ?? []

  const changeFilter = (v) => {
    setFilter(v)
    setPage(1)
  }

  const markRead = async (n) => {
    try {
      await notificationsApi.markRead(n.id)
      setData((d) => d && { ...d, items: d.items.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) })
      announceNotificationsChanged('page')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not mark as read.'), 'error')
    }
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationsApi.markAllRead()
      notify('All notifications marked as read.', 'success')
      if (page !== 1) setPage(1)
      else reload()
      announceNotificationsChanged('page')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not mark all as read.'), 'error')
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <AppShell
      title="Notifications"
      subtitle="Your inbox"
      actions={
        <Button variant="secondary" icon={Send} onClick={() => setSendOpen(true)}>
          <span className="hidden sm:inline">Send notification</span>
          <span className="sm:hidden">Send</span>
        </Button>
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <Tabs options={FILTERS} value={filter} onChange={changeFilter} />
        <Button variant="ghost" icon={CheckCheck} onClick={markAllRead} loading={markingAll} disabled={filter === 'unread' && items.length === 0} className="self-start sm:self-auto">
          Mark all read
        </Button>
      </div>

      <Card>
        <AsyncContent
          loading={loading}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={Bell}
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              message={filter === 'unread' ? "You're all caught up." : 'Notifications sent to you will appear here.'}
            />
          }
        >
          <ul className="divide-y divide-line">
            {items.map((n) => {
              const unread = isUnread(n)
              const body = notificationBody(n)
              const time = notificationTime(n)
              return (
                <li key={n.id} className={`flex items-start gap-3 px-4 sm:px-5 py-4 ${unread ? 'bg-board/5' : ''}`}>
                  <span className={`mt-2 w-2 h-2 rounded-full shrink-0 ${unread ? 'bg-coral' : 'bg-transparent'}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm break-words ${unread ? 'font-semibold text-ink' : 'font-medium text-ink/75'}`}>{notificationTitle(n)}</p>
                      {n.type && <Badge tone="neutral">{titleCase(n.type)}</Badge>}
                    </div>
                    {body && <p className="text-sm text-ink/60 mt-1 whitespace-pre-line break-words">{body}</p>}
                    {time && (
                      <p className="text-xs text-ink/40 mt-1.5" title={formatDateTime(time)}>
                        {timeAgo(time)}
                      </p>
                    )}
                  </div>
                  {unread && (
                    <Button variant="ghost" size="sm" icon={Check} onClick={() => markRead(n)} className="shrink-0">
                      <span className="hidden sm:inline">Mark read</span>
                      <span className="sr-only sm:hidden">Mark read</span>
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </AsyncContent>
      </Card>

      {!loading && !error && data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}

      <SendNotificationModal open={sendOpen} onClose={() => setSendOpen(false)} onSent={() => notify('Notification sent.', 'success')} />
    </AppShell>
  )
}
