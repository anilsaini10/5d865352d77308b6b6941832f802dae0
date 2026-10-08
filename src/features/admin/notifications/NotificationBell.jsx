import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { PageLoader } from '../../../components/ui.jsx'
import { notificationsApi } from './notifications.api.js'
import {
  NOTIFICATIONS_CHANGED,
  announceNotificationsChanged,
  isUnread,
  notificationBody,
  notificationTime,
  notificationTitle,
  timeAgo,
} from './components/notificationUtils.js'

const POLL_MS = 60_000
const PREVIEW_COUNT = 8

export default function NotificationBell() {
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const refreshCount = useCallback(() => {
    notificationsApi
      .unreadCount()
      .then((n) => setCount(Number(n) || 0))
      .catch(() => {})
  }, [])

  const loadItems = useCallback(() => {
    setLoading(true)
    setError(false)
    notificationsApi
      .list({ page: 1, pageSize: PREVIEW_COUNT })
      .then((res) => setItems(res.items))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refreshCount()
    const timer = setInterval(refreshCount, POLL_MS)
    window.addEventListener('focus', refreshCount)
    window.addEventListener(NOTIFICATIONS_CHANGED, refreshCount)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refreshCount)
      window.removeEventListener(NOTIFICATIONS_CHANGED, refreshCount)
    }
  }, [refreshCount])

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    if (!open) {
      loadItems()
      refreshCount()
    }
    setOpen((o) => !o)
  }

  const markRead = (n) => {
    if (!isUnread(n)) return
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
    setCount((c) => Math.max(0, c - 1))
    notificationsApi
      .markRead(n.id)
      .then(() => announceNotificationsChanged('bell'))
      .catch(refreshCount)
  }

  const markAllRead = () => {
    setItems((list) => list.map((x) => ({ ...x, isRead: true })))
    setCount(0)
    notificationsApi
      .markAllRead()
      .then(() => announceNotificationsChanged('bell'))
      .catch(refreshCount)
  }

  const viewAll = () => {
    setOpen(false)
    navigate('/notifications')
  }

  const badge = count > 9 ? '9+' : String(count)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative rounded-lg p-2 text-ink/60 hover:text-ink hover:bg-line/50 transition-colors"
      >
        <Bell size={19} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-white text-[10px] font-bold leading-[18px] text-center">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-[calc(100vw-2.5rem)] max-w-sm bg-paper border border-line rounded-2xl shadow-pop overflow-hidden animate-rise">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
            <p className="font-display font-semibold text-ink">Notifications</p>
            <button
              type="button"
              onClick={markAllRead}
              disabled={count === 0 && !items.some(isUnread)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-board hover:underline disabled:opacity-40 disabled:no-underline"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 ? (
              <PageLoader className="py-10" />
            ) : error ? (
              <p className="px-4 py-8 text-sm text-center text-coral font-medium">Could not load notifications.</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-sm text-center text-ink/45">You're all caught up.</p>
            ) : (
              <ul className="divide-y divide-line">
                {items.map((n) => {
                  const unread = isUnread(n)
                  const body = notificationBody(n)
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => markRead(n)}
                        className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-line/30 transition-colors ${unread ? 'bg-board/5' : ''}`}
                      >
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${unread ? 'bg-coral' : 'bg-transparent'}`} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm break-words ${unread ? 'font-semibold text-ink' : 'text-ink/75'}`}>{notificationTitle(n)}</span>
                          {body && <span className="block text-xs text-ink/55 mt-0.5 line-clamp-2 break-words">{body}</span>}
                          <span className="block text-[11px] text-ink/40 mt-1">{timeAgo(notificationTime(n))}</span>
                        </span>
                        {unread && <span className="sr-only">Unread — click to mark as read</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={viewAll}
            className="w-full px-4 py-3 border-t border-line text-sm font-semibold text-board hover:bg-line/30 transition-colors"
          >
            View all
          </button>
        </div>
      )}
    </div>
  )
}
