import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, Filter } from 'lucide-react'
import { Card, AsyncContent, PageLoader, Tabs, Badge, Button, Alert, Modal, Field, inputClass, selectClass, FormActions, Table, THead, Th, Td, Tr } from '../../../components/ui.jsx'
import Pagination from '../../../components/Pagination.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage, getErrorCode } from '../../../api/httpClient.js'
import { interventionsApi } from './interventions.api.js'
import { teachersApi } from '../teachers/teachers.api.js'
import AnalyticsShell from './components/AnalyticsShell.jsx'
import { fmtDay, alertTypeLabel } from './analytics.helpers.js'

const STATUS_TONES = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'cancelled',
}

const STATUS_STEPS = ['OPEN', 'IN_PROGRESS', 'COMPLETED']

function StatusStepper({ current, onChange }) {
  const idx = STATUS_STEPS.indexOf(current)
  return (
    <div className="flex items-center gap-2 mb-4">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= idx
        const isCurrent = step === current
        return (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold text-center transition-colors border ${
              isCurrent
                ? 'bg-board text-on-board border-board'
                : done
                  ? 'bg-board/10 text-board border-board/20'
                  : 'bg-line/30 text-ink/40 border-line hover:bg-line/50'
            }`}
          >
            {step.replace('_', ' ')}
          </button>
        )
      })}
    </div>
  )
}

function EditInterventionModal({ open, onClose, interventionId, onUpdated }) {
  const { notify } = useToast()
  const [form, setForm] = useState({
    title: '', description: '', actionTaken: '', status: 'OPEN',
    assignedTo: '', dueDate: '', followUpDate: '', outcome: '',
  })
  const [original, setOriginal] = useState(null)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')

  const { data: allTeachers } = useFetch(() => teachersApi.listAll(), [], { enabled: open })

  useEffect(() => {
    if (!open || !interventionId) return
    setLoadError('')
    setServerError('')
    setErrors({})
    interventionsApi.get(interventionId)
      .then((item) => {
        setOriginal(item)
        setForm({
          title: item.title || '',
          description: item.description || '',
          actionTaken: item.actionTaken || '',
          status: item.status || 'OPEN',
          assignedTo: item.assignedTo?.id || '',
          dueDate: item.dueDate || '',
          followUpDate: item.followUpDate || '',
          outcome: item.outcome || '',
        })
      })
      .catch((err) => setLoadError(getErrorMessage(err, 'Could not load intervention.')))
  }, [open, interventionId])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleStatusChange = (newStatus) => {
    setForm((f) => ({ ...f, status: newStatus }))
  }

  const teachers = allTeachers ?? []
  const showOutcome = form.status === 'COMPLETED'

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setErrors({ title: 'Title is required.' })
      return
    }
    if (form.status === 'COMPLETED' && !form.outcome.trim()) {
      setErrors({ outcome: 'Outcome is required when completing.' })
      return
    }
    setSubmitting(true)
    setServerError('')
    try {
      const body = {}
      if (form.title !== original?.title) body.title = form.title.trim()
      if (form.description !== (original?.description || '')) body.description = form.description.trim() || null
      if (form.actionTaken !== (original?.actionTaken || '')) body.actionTaken = form.actionTaken.trim() || null
      if (form.status !== original?.status) body.status = form.status
      const origAssignee = original?.assignedTo?.id || ''
      if (form.assignedTo !== origAssignee) body.assignedTo = form.assignedTo || null
      if (form.dueDate !== (original?.dueDate || '')) body.dueDate = form.dueDate || null
      if (form.followUpDate !== (original?.followUpDate || '')) body.followUpDate = form.followUpDate || null
      if (form.outcome !== (original?.outcome || '')) body.outcome = form.outcome.trim() || null

      if (Object.keys(body).length === 0) {
        onClose()
        return
      }

      await interventionsApi.update(interventionId, body)
      notify('Intervention updated.', 'success')
      onUpdated?.()
      onClose()
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'INVALID_ASSIGNEE') {
        setServerError(getErrorMessage(err, 'Invalid assignee.'))
      } else {
        setServerError(getErrorMessage(err, 'Could not update intervention.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!original) return
    setSubmitting(true)
    try {
      await interventionsApi.update(interventionId, { status: 'CANCELLED' })
      notify('Intervention cancelled.', 'info')
      onUpdated?.()
      onClose()
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not cancel intervention.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit intervention" subtitle={original ? `#${original.id?.slice(0, 8)}` : ''} wide>
      {loadError ? (
        <Alert>{loadError}</Alert>
      ) : !original ? (
        <PageLoader />
      ) : (
        <form onSubmit={submit}>
          {serverError && <Alert className="mb-4">{serverError}</Alert>}

          <StatusStepper current={form.status} onChange={handleStatusChange} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title" required error={errors.title} className="sm:col-span-2">
              <input className={inputClass} value={form.title} onChange={set('title')} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea className={`${inputClass} h-20`} value={form.description} onChange={set('description')} />
            </Field>
            <Field label="Action taken" className="sm:col-span-2">
              <textarea className={`${inputClass} h-20`} value={form.actionTaken} onChange={set('actionTaken')} />
            </Field>
            {showOutcome && (
              <Field label="Outcome" required error={errors.outcome} className="sm:col-span-2">
                <textarea className={`${inputClass} h-20`} value={form.outcome} onChange={set('outcome')} placeholder="Describe the outcome…" />
              </Field>
            )}
            <Field label="Assigned to">
              <select className={selectClass} value={form.assignedTo} onChange={set('assignedTo')}>
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t.userId || t.id} value={t.userId || t.id}>{t.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Due date">
              <input type="date" className={inputClass} value={form.dueDate} onChange={set('dueDate')} />
            </Field>
            <Field label="Follow-up date">
              <input type="date" className={inputClass} value={form.followUpDate} onChange={set('followUpDate')} />
            </Field>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-line">
            {original.status !== 'CANCELLED' && original.status !== 'COMPLETED' && (
              <Button variant="danger-ghost" size="sm" onClick={handleCancel} disabled={submitting}>
                Cancel intervention
              </Button>
            )}
            <div className="flex-1" />
            <FormActions onCancel={onClose} submitting={submitting} submitLabel="Save" />
          </div>

          {original.createdBy && (
            <p className="text-xs text-ink/35 mt-3">
              Created by {original.createdBy.name} on {fmtDay(original.createdAt)}
              {original.completedAt && ` · Completed ${fmtDay(original.completedAt)}`}
            </p>
          )}
        </form>
      )}
    </Modal>
  )
}

export default function InterventionsAnalyticsPage() {
  const { notify } = useToast()
  const [statusTab, setStatusTab] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [editId, setEditId] = useState(null)

  const { data, loading, error, reload } = useFetch(
    () => interventionsApi.list({
      page,
      pageSize: 20,
      ...(statusTab ? { status: statusTab } : {}),
      ...(overdueOnly ? { overdue: true } : {}),
    }).catch((err) => {
      if (err?.response?.status === 500) return { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0, statusCounts: {} }
      throw err
    }),
    [page, statusTab, overdueOnly],
    { errorMessage: 'Could not load interventions.' },
  )

  const items = data?.items ?? []
  const counts = data?.statusCounts ?? {}
  const totalAll = (counts.OPEN ?? 0) + (counts.IN_PROGRESS ?? 0) + (counts.COMPLETED ?? 0) + (counts.CANCELLED ?? 0)

  const statusTabs = [
    { value: '', label: 'All', count: totalAll || undefined },
    { value: 'OPEN', label: 'Open', count: counts.OPEN },
    { value: 'IN_PROGRESS', label: 'In progress', count: counts.IN_PROGRESS },
    { value: 'COMPLETED', label: 'Completed', count: counts.COMPLETED },
    { value: 'CANCELLED', label: 'Cancelled', count: counts.CANCELLED },
  ]

  const handleTabChange = (v) => {
    setStatusTab(v)
    setPage(1)
  }

  return (
    <AnalyticsShell title="Interventions">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Tabs options={statusTabs} value={statusTab} onChange={handleTabChange} />
        <Button
          variant={overdueOnly ? 'primary' : 'secondary'}
          size="sm"
          icon={Clock}
          onClick={() => { setOverdueOnly((v) => !v); setPage(1) }}
        >
          Overdue
        </Button>
      </div>

      <Card>
        <AsyncContent
          loading={loading && !data}
          error={error}
          empty={items.length === 0}
          emptyState={
            <div className="text-center py-12 text-sm text-ink/50">
              {error?.includes('500')
                ? 'Interventions require the analytics_interventions migration.'
                : 'No interventions found.'}
            </div>
          }
        >
          <Table>
            <THead>
              <Th>Title</Th>
              <Th>Entity</Th>
              <Th>Status</Th>
              <Th>Assigned to</Th>
              <Th>Due date</Th>
              <Th>Created</Th>
            </THead>
            <tbody>
              {items.map((item) => (
                <Tr
                  key={item.id}
                  className="cursor-pointer hover:bg-line/20"
                  onClick={() => setEditId(item.id)}
                >
                  <Td className="font-semibold text-ink max-w-xs truncate">
                    <div className="flex items-center gap-2">
                      {item.title}
                      {item.overdue && (
                        <span className="inline-flex items-center gap-1 text-coral text-xs font-semibold">
                          <Clock size={12} /> Overdue
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Badge tone="neutral">{item.entityType}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONES[item.status] || 'neutral'}>{item.status?.replace('_', ' ')}</Badge>
                  </Td>
                  <Td>{item.assignedTo?.name || '—'}</Td>
                  <Td>{fmtDay(item.dueDate)}</Td>
                  <Td>{fmtDay(item.createdAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
        {data && (
          <div className="px-5 pb-4">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
          </div>
        )}
      </Card>

      <EditInterventionModal
        open={!!editId}
        onClose={() => setEditId(null)}
        interventionId={editId}
        onUpdated={reload}
      />
    </AnalyticsShell>
  )
}
