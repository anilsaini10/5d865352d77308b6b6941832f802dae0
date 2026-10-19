import { useEffect, useState } from 'react'
import { CircleDot, LifeBuoy, Send } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import RichContent from '../../../components/RichContent.jsx'
import RichTextEditor from '../../../components/RichTextEditor.jsx'
import { Alert, AsyncContent, Badge, Button, Card, EmptyState, Field, Modal, Tabs, inputClass, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'
import { formatDateTime } from '../../../utils/format.js'
import { isHtmlEmpty, sanitizeHtml } from '../../../utils/sanitizeHtml.js'
import { CATEGORIES, HTML_MAX, SUBJECT_MAX, SUPPORT_STATUSES, statusMeta } from '../../support/support.constants.js'
import { parseFieldErrors } from '../school/school.utils.js'
import { helpApi } from './help.api.js'

const STATUS_TABS = [{ value: '', label: 'All' }, ...SUPPORT_STATUSES.map(({ value, label }) => ({ value, label }))]
const emptyForm = { subject: '', category: '', message: '' }

function validate({ subject, message }) {
  const errors = {}
  const s = subject.trim()
  if (!s) errors.subject = 'Enter a subject.'
  else if (s.length > SUBJECT_MAX) errors.subject = `Subject must be at most ${SUBJECT_MAX} characters.`
  if (isHtmlEmpty(message)) errors.message = 'Describe your question or problem.'
  else if (message.length > HTML_MAX) errors.message = `Message is too long (max ${HTML_MAX.toLocaleString()} characters including formatting).`
  return errors
}

function QueryRow({ q, onOpen }) {
  const meta = statusMeta(q.status)
  return (
    <li>
      <button type="button" onClick={() => onOpen(q)} className="w-full text-left px-5 py-4 hover:bg-line/20 transition-colors">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ink">{q.subject}</p>
          {q.category && <span className="rounded-full bg-line/50 border border-line px-2 py-0.5 text-xs text-ink/65">{q.category}</span>}
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {q.reply && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><CircleDot size={12} /> Replied</span>
          )}
          <span className="ml-auto text-xs text-ink/45">{formatDateTime(q.createdAt)}</span>
        </div>
      </button>
    </li>
  )
}

function QueryDetail({ query, onClose, onGone }) {
  const { notify } = useToast()
  const [full, setFull] = useState(null)

  useEffect(() => {
    let cancelled = false
    setFull(null)
    if (query) {
      helpApi
        .get(query.id)
        .then((q) => !cancelled && setFull(q))
        .catch((err) => {
          if (cancelled) return
          if (getErrorCode(err) === 'SUPPORT_QUERY_NOT_FOUND') {
            notify(getErrorMessage(err, 'That query no longer exists.'), 'error')
            onGone()
          }
          // other failures: keep showing the list row's data
        })
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query?.id])

  if (!query) return null
  const q = full ?? query
  const meta = statusMeta(q.status)

  return (
    <Modal open onClose={onClose} wide title={q.subject} subtitle={`Sent ${formatDateTime(q.createdAt)}`}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {q.category && <span className="rounded-full bg-line/50 border border-line px-2 py-0.5 text-xs text-ink/65">{q.category}</span>}
        </div>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1.5">Your query</h3>
          <RichContent html={q.message} className="text-sm text-ink" />
        </section>

        <section className="rounded-xl border border-line bg-line/15 px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1.5">Support reply</h3>
          {q.reply ? (
            <>
              <RichContent html={q.reply} className="text-sm text-ink" />
              {q.repliedAt && <p className="text-xs text-ink/45 mt-2">Replied on {formatDateTime(q.repliedAt)}</p>}
            </>
          ) : (
            <p className="text-sm text-ink/55">Awaiting reply from support.</p>
          )}
        </section>

        <p className="text-xs text-ink/45">Queries can’t be edited. For a follow-up, send a new query.</p>
      </div>
    </Modal>
  )
}

export default function HelpPage() {
  const { notify } = useToast()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [rateMessage, setRateMessage] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null)

  const { data, setData, loading, error, reload } = useFetch(() => helpApi.list({ page, status }), [page, status], {
    errorMessage: 'Could not load your queries.',
  })
  const items = data?.items ?? []

  // Submit stays disabled while the rate-limit cooldown counts down.
  useEffect(() => {
    if (cooldown <= 0) return undefined
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])
  useEffect(() => {
    if (cooldown === 0) setRateMessage('')
  }, [cooldown])

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
    setServerError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    const v = validate(form)
    setErrors(v)
    if (Object.keys(v).length > 0) return

    setSubmitting(true)
    setServerError('')
    try {
      const created = await helpApi.create({
        subject: form.subject.trim(),
        category: form.category || null,
        message: sanitizeHtml(form.message),
      })
      notify('Query sent. Our team will reply here.', 'success')
      setForm(emptyForm)
      // Prepend when the current view would include it; otherwise just refetch.
      if (page === 1 && (!status || status === 'OPEN') && data) {
        setData((d) => ({ ...d, items: [created, ...d.items].slice(0, d.pageSize ?? 10), total: (d.total ?? 0) + 1 }))
      } else {
        setStatus('')
        setPage(1)
        reload()
      }
    } catch (err) {
      const code = getErrorCode(err)
      const message = getErrorMessage(err, 'Could not send your query.')
      if (code === 'TOO_MANY_REQUESTS') {
        const wait = Number(err?.response?.data?.error?.details?.retryAfterSeconds)
        setRateMessage(message)
        setCooldown(Number.isFinite(wait) && wait > 0 ? Math.ceil(wait) : 60)
      } else if (code === 'VALIDATION_ERROR') {
        const fields = parseFieldErrors(message)
        const known = Object.fromEntries(Object.entries(fields).filter(([k]) => ['subject', 'category', 'message'].includes(k)))
        if (Object.keys(known).length) setErrors(known)
        else setServerError(message)
      } else {
        setServerError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const cooldownLabel = cooldown >= 60 ? `${Math.floor(cooldown / 60)}m ${cooldown % 60}s` : `${cooldown}s`

  return (
    <AppShell title="Help & Support" subtitle="Send a question or problem to our team and track the reply">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-6 items-start">
        <Card className="p-5">
          <h2 className="font-display text-base font-semibold text-ink mb-4">New query</h2>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Subject" required error={errors.subject}>
              <input className={inputClass} value={form.subject} onChange={(e) => set('subject')(e.target.value)} placeholder="Short summary of your query" />
            </Field>
            <p className={`-mt-3 text-right text-xs ${form.subject.trim().length > SUBJECT_MAX ? 'text-coral font-semibold' : 'text-ink/40'}`}>
              {form.subject.trim().length}/{SUBJECT_MAX}
            </p>

            <Field label="Category" error={errors.category}>
              <select className={selectClass} value={form.category} onChange={(e) => set('category')(e.target.value)}>
                <option value="">— None —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <div>
              <span className="text-sm font-semibold text-ink/80">Message <span className="text-coral">*</span></span>
              <div className="mt-1.5">
                <RichTextEditor
                  value={form.message}
                  onChange={set('message')}
                  invalid={!!errors.message}
                  disabled={submitting}
                  minHeight="12rem"
                  placeholder="Describe your question or problem. Steps to reproduce help a lot."
                />
              </div>
              {errors.message && <p className="text-xs text-coral mt-1 font-medium">{errors.message}</p>}
            </div>

            {cooldown > 0 && <Alert tone="warning">{rateMessage || 'You’ve sent too many queries.'} You can send another in {cooldownLabel}.</Alert>}
            <Alert>{serverError}</Alert>

            <div className="flex justify-end">
              <Button type="submit" icon={Send} loading={submitting} disabled={cooldown > 0}>
                {cooldown > 0 ? `Try again in ${cooldownLabel}` : 'Send query'}
              </Button>
            </div>
          </form>
        </Card>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="font-display text-base font-semibold text-ink">My queries</h2>
            <div className="overflow-x-auto max-w-full">
              <Tabs options={STATUS_TABS} value={status} onChange={(v) => { setStatus(v); setPage(1) }} />
            </div>
          </div>
          <Card>
            <AsyncContent
              loading={loading && !data}
              error={error}
              empty={items.length === 0}
              emptyState={
                <EmptyState
                  icon={LifeBuoy}
                  title={status ? `No ${statusMeta(status).label.toLowerCase()} queries` : 'No queries yet'}
                  message={status ? 'Try another status.' : 'No queries yet. Send your first one on the left.'}
                />
              }
            >
              <ul className="divide-y divide-line">{items.map((q) => <QueryRow key={q.id} q={q} onOpen={setViewing} />)}</ul>
            </AsyncContent>
          </Card>
          {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
        </div>
      </div>

      <QueryDetail query={viewing} onClose={() => setViewing(null)} onGone={() => { setViewing(null); reload() }} />
    </AppShell>
  )
}
