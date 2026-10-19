import { useEffect, useState } from 'react'
import { Check, Copy, Eraser, Send, X } from 'lucide-react'
import RichContent from '../../components/RichContent.jsx'
import RichTextEditor from '../../components/RichTextEditor.jsx'
import { Alert, Badge, Button, ConfirmDialog, selectClass } from '../../components/ui.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../api/httpClient.js'
import { formatDateTime } from '../../utils/format.js'
import { isHtmlEmpty, sanitizeHtml } from '../../utils/sanitizeHtml.js'
import { parseFieldErrors } from '../admin/school/school.utils.js'
import { HTML_MAX, SENDER_ROLES, SUPPORT_STATUSES, statusMeta } from './support.constants.js'
import { supportInboxApi } from './supportInbox.api.js'

function CopyText({ value }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — the text is still selectable
    }
  }
  return (
    <button type="button" onClick={copy} title="Click to copy" className="inline-flex items-center gap-1 text-ink/70 hover:text-ink">
      {value} {copied ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-ink/35" />}
    </button>
  )
}

const defaultStatus = (q) => (q.status === 'OPEN' ? 'IN_PROGRESS' : q.status)

/** Right-hand panel: sender info, the message, a reply editor and status controls. */
export default function SupportDetailDrawer({ query, onClose, onUpdated, onGone }) {
  const { notify } = useToast()
  const [q, setQ] = useState(query)
  const [reply, setReply] = useState(query.reply ?? '')
  const [status, setStatus] = useState(defaultStatus(query))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(null) // 'reply' | 'status' | 'remove'
  const [removeOpen, setRemoveOpen] = useState(false)

  // Row data first, then the full record.
  useEffect(() => {
    let cancelled = false
    supportInboxApi
      .get(query.id)
      .then((full) => {
        if (cancelled) return
        setQ(full)
        setReply(full.reply ?? '')
        setStatus(defaultStatus(full))
      })
      .catch((err) => {
        if (!cancelled && getErrorCode(err) === 'SUPPORT_QUERY_NOT_FOUND') {
          notify(getErrorMessage(err, 'That query no longer exists.'), 'error')
          onGone()
        }
      })
    const onKey = (e) => e.key === 'Escape' && !removeOpen && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      cancelled = true
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.id])

  const save = async (kind, body, successMessage) => {
    setBusy(kind)
    setErrors({})
    try {
      const updated = await supportInboxApi.update(q.id, body)
      setQ(updated)
      setReply(updated.reply ?? '')
      setStatus(updated.status === 'OPEN' ? 'IN_PROGRESS' : updated.status)
      onUpdated(updated)
      notify(successMessage, 'success')
    } catch (err) {
      const code = getErrorCode(err)
      const message = getErrorMessage(err, 'Could not update the query.')
      if (code === 'SUPPORT_QUERY_NOT_FOUND') {
        notify(message, 'error')
        onGone()
      } else if (code === 'VALIDATION_ERROR') {
        const fields = parseFieldErrors(message)
        if (fields.reply || fields.status) setErrors(fields)
        else setErrors({ general: message })
      } else {
        notify(message, 'error')
      }
    } finally {
      setBusy(null)
    }
  }

  const sendReply = () => {
    if (isHtmlEmpty(reply)) return setErrors({ reply: 'Write a reply first.' })
    if (reply.length > HTML_MAX) return setErrors({ reply: `Reply is too long (max ${HTML_MAX.toLocaleString()} characters including formatting).` })
    save('reply', { reply: sanitizeHtml(reply), status }, 'Reply sent.')
  }

  const meta = statusMeta(q.status)
  const roleLabel = SENDER_ROLES.find((r) => r.value === q.createdBy?.role)?.label ?? q.createdBy?.role
  const busyAny = !!busy

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label={q.subject} className="relative w-full max-w-xl h-full bg-paper border-l border-line shadow-pop overflow-y-auto animate-rise">
        <header className="sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-line px-6 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold text-ink break-words">{q.subject}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge tone={meta.tone}>{meta.label}</Badge>
              {q.category && <span className="rounded-full bg-line/50 border border-line px-2 py-0.5 text-xs text-ink/65">{q.category}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-ink/50 hover:text-ink hover:bg-line/40 rounded-full p-1.5" aria-label="Close panel"><X size={18} /></button>
        </header>

        <div className="px-6 py-5 space-y-6">
          <section className="rounded-xl border border-line bg-surface p-4 text-sm space-y-1.5">
            <p><span className="text-ink/45">School:</span> <span className="font-semibold text-ink">{q.schoolName}</span></p>
            <p className="flex flex-wrap items-center gap-x-2">
              <span className="text-ink/45">From:</span> <span className="font-semibold text-ink">{q.createdBy?.name}</span>
              {roleLabel && <Badge tone="primary">{roleLabel}</Badge>}
            </p>
            <p><span className="text-ink/45">Email:</span> <CopyText value={q.createdBy?.email} /></p>
            {q.createdBy?.phone && <p><span className="text-ink/45">Phone:</span> <CopyText value={q.createdBy.phone} /></p>}
            <p><span className="text-ink/45">Sent:</span> {formatDateTime(q.createdAt)}</p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1.5">Message</h3>
            <RichContent html={q.message} className="text-sm text-ink" />
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1.5">Reply</h3>
            <RichTextEditor value={reply} onChange={(html) => { setReply(html); setErrors((e) => ({ ...e, reply: undefined })) }} invalid={!!errors.reply} disabled={busyAny} minHeight="9rem" placeholder="Write your reply to the sender…" />
            {errors.reply && <p className="text-xs text-coral mt-1 font-medium">{errors.reply}</p>}
            {q.reply && q.repliedAt && (
              <p className="text-xs text-ink/50 mt-2">Replied by {q.repliedBy?.name ?? 'support'} on {formatDateTime(q.repliedAt)}</p>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-ink/60">Status</span>
                <select className={`${selectClass} mt-1 w-44`} value={status} disabled={busyAny} onChange={(e) => { setStatus(e.target.value); setErrors((er) => ({ ...er, status: undefined })) }}>
                  {SUPPORT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <Button icon={Send} loading={busy === 'reply'} disabled={busyAny} onClick={sendReply}>Send reply</Button>
              <Button variant="secondary" loading={busy === 'status'} disabled={busyAny || status === q.status} onClick={() => save('status', { status }, 'Status updated.')}>Update status</Button>
              {q.reply && (
                <Button variant="danger-ghost" icon={Eraser} disabled={busyAny} onClick={() => setRemoveOpen(true)}>Remove reply</Button>
              )}
            </div>
            {errors.status && <p className="text-xs text-coral mt-2 font-medium">{errors.status}</p>}
            <Alert className="mt-3">{errors.general}</Alert>
          </section>
        </div>
      </aside>

      <ConfirmDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => save('remove', { reply: null }, 'Reply removed.')}
        title="Remove this reply?"
        confirmLabel="Remove reply"
        message="The sender will no longer see a reply. The status stays as it is."
      />
    </div>
  )
}
