import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ShieldAlert, Users, ClipboardList, Clock, ChevronRight } from 'lucide-react'
import { Card, AsyncContent, PageLoader, Tabs, Badge, Button, Alert, Modal, Field, inputClass, selectClass, FormActions } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage, getErrorCode } from '../../../api/httpClient.js'
import { analyticsApi } from './analytics.api.js'
import { interventionsApi } from './interventions.api.js'
import { teachersApi } from '../teachers/teachers.api.js'
import { useAnalyticsFilters } from './useAnalyticsFilters.js'
import AnalyticsShell from './components/AnalyticsShell.jsx'
import FilterBar from './components/FilterBar.jsx'
import KpiCard from './components/KpiCard.jsx'
import { fmtCount, alertTypeLabel, evidenceLabel, fmtDay } from './analytics.helpers.js'

const SEVERITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
]

const ALERT_TYPES = [
  'LOW_ATTENDANCE', 'REPEATED_ABSENCE', 'DECLINING_MARKS', 'LEARNING_GAP',
  'MISSING_HOMEWORK', 'INCOMPLETE_MARKS_ENTRY', 'DELAYED_GRADING', 'HOMEWORK_NOT_CHECKED',
]

const STATUS_TONES = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
}

const SEVERITY_TONES = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'info',
}

function SeverityBadge({ severity }) {
  return <Badge tone={SEVERITY_TONES[severity] || 'neutral'}>{severity}</Badge>
}

function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] || 'neutral'}>{status?.replace('_', ' ')}</Badge>
}

const emptyForm = {
  alertKey: '', alertType: '', entityType: '', entityId: '', title: '',
  description: '', actionTaken: '', status: 'OPEN', assignedTo: '', dueDate: '', followUpDate: '',
}

function CreateInterventionModal({ open, onClose, alert, onCreated }) {
  const { notify } = useToast()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: allTeachers } = useFetch(() => teachersApi.listAll(), [], { enabled: open })

  useEffect(() => {
    if (!open) return
    setErrors({})
    setServerError('')
    if (alert) {
      setForm({
        ...emptyForm,
        alertKey: alert.key || '',
        alertType: alert.type || '',
        entityType: alert.entity?.type || '',
        entityId: alert.entity?.id || '',
        title: `${alertTypeLabel(alert.type)}: ${alert.entity?.name || ''}`,
      })
    } else {
      setForm(emptyForm)
    }
  }, [open, alert])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const suggestedOwners = alert?.suggestedOwners ?? []
  const teachers = allTeachers ?? []
  const suggestedIds = new Set(suggestedOwners.map((o) => o.userId))
  const otherTeachers = teachers.filter((t) => !suggestedIds.has(t.userId))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setErrors({ title: 'Title is required.' })
      return
    }
    setSubmitting(true)
    setServerError('')
    try {
      const body = {
        title: form.title.trim(),
        entityType: form.entityType,
        entityId: form.entityId,
      }
      if (form.alertKey) body.alertKey = form.alertKey
      if (form.alertType) body.alertType = form.alertType
      if (form.description.trim()) body.description = form.description.trim()
      if (form.actionTaken.trim()) body.actionTaken = form.actionTaken.trim()
      if (form.status && form.status !== 'OPEN') body.status = form.status
      if (form.assignedTo) body.assignedTo = form.assignedTo
      if (form.dueDate) body.dueDate = form.dueDate
      if (form.followUpDate) body.followUpDate = form.followUpDate

      await interventionsApi.create(body)
      notify('Intervention created.', 'success')
      onCreated?.()
      onClose()
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'ENTITY_NOT_FOUND') {
        notify(getErrorMessage(err, 'Entity not found.'), 'error')
        onClose()
      } else if (code === 'INVALID_ASSIGNEE') {
        setServerError(getErrorMessage(err, 'Invalid assignee.'))
      } else {
        setServerError(getErrorMessage(err, 'Could not create intervention.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create intervention" wide>
      <form onSubmit={submit}>
        {serverError && <Alert className="mb-4">{serverError}</Alert>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title" required error={errors.title} className="sm:col-span-2">
            <input className={inputClass} value={form.title} onChange={set('title')} />
          </Field>
          <Field label="Entity type">
            <input className={inputClass} value={form.entityType} readOnly />
          </Field>
          <Field label="Entity ID">
            <input className={inputClass} value={form.entityId} readOnly />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea className={`${inputClass} h-20`} value={form.description} onChange={set('description')} />
          </Field>
          <Field label="Action taken" className="sm:col-span-2">
            <textarea className={`${inputClass} h-20`} value={form.actionTaken} onChange={set('actionTaken')} />
          </Field>
          <Field label="Assigned to">
            <select className={selectClass} value={form.assignedTo} onChange={set('assignedTo')}>
              <option value="">Unassigned</option>
              {suggestedOwners.length > 0 && (
                <optgroup label="Suggested">
                  {suggestedOwners.map((o) => (
                    <option key={o.userId} value={o.userId}>{o.name}</option>
                  ))}
                </optgroup>
              )}
              {otherTeachers.length > 0 && (
                <optgroup label="All teachers">
                  {otherTeachers.map((t) => (
                    <option key={t.userId || t.id} value={t.userId || t.id}>{t.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </Field>
          <Field label="Status">
            <select className={selectClass} value={form.status} onChange={set('status')}>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" className={inputClass} value={form.dueDate} onChange={set('dueDate')} />
          </Field>
          <Field label="Follow-up date">
            <input type="date" className={inputClass} value={form.followUpDate} onChange={set('followUpDate')} />
          </Field>
        </div>
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Create" />
      </form>
    </Modal>
  )
}

function AlertCard({ alert, onTakeAction }) {
  const navigate = useNavigate()
  const entity = alert.entity || {}
  const context = entity.context ? ` · ${entity.context}` : ''
  const evidence = alert.evidence ? Object.entries(alert.evidence) : []

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={alert.severity} />
            <Badge tone="neutral">{alertTypeLabel(alert.type)}</Badge>
            {alert.status && <StatusBadge status={alert.intervention?.status || alert.status} />}
          </div>
          <h3 className="font-display font-semibold text-ink mt-2">
            {entity.name}{context}
          </h3>
          {evidence.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {evidence.map(([k, v]) => (
                <span key={k} className="inline-flex items-center rounded-full bg-line/50 px-2.5 py-0.5 text-xs text-ink/60">
                  {evidenceLabel(k)}: <span className="font-semibold text-ink/80 ml-1">{typeof v === 'number' ? fmtCount(v) : String(v)}</span>
                </span>
              ))}
            </div>
          )}
          {alert.recommendedAction && (
            <p className="text-sm text-ink/55 mt-2">{alert.recommendedAction}</p>
          )}
          {alert.assignedTo && (
            <p className="text-xs text-ink/40 mt-1.5">Assigned to: {alert.assignedTo.name}</p>
          )}
        </div>
        <div className="shrink-0">
          {alert.intervention ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/analytics/interventions')}
              icon={ChevronRight}
            >
              View intervention
            </Button>
          ) : (
            <Button size="sm" onClick={() => onTakeAction(alert)}>
              Take action
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AlertsAnalyticsPage() {
  const { filters, setFilter, queryParams } = useAnalyticsFilters()
  const { notify } = useToast()

  const [severityTab, setSeverityTab] = useState('')
  const [alertType, setAlertType] = useState('')
  const [interventionAlert, setInterventionAlert] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const { data: risk, loading: riskLoading, error: riskError } = useFetch(
    () => analyticsApi.riskSummary(queryParams).catch((err) => {
      if (err?.response?.status === 500) return null
      throw err
    }),
    [JSON.stringify(queryParams)],
    { errorMessage: 'Could not load risk summary.' },
  )

  const { data: alertsData, loading: alertsLoading, error: alertsError, reload: reloadAlerts } = useFetch(
    () => analyticsApi.alerts({
      ...queryParams,
      ...(severityTab ? { severity: severityTab } : {}),
      ...(alertType ? { type: alertType } : {}),
      limit: 100,
    }).catch((err) => {
      if (err?.response?.status === 500) return { total: 0, returned: 0, alerts: [], notAvailable: {} }
      throw err
    }),
    [JSON.stringify(queryParams), severityTab, alertType],
    { errorMessage: 'Could not load alerts.' },
  )

  const alerts = alertsData?.alerts ?? []
  const bySeverity = risk?.alerts?.bySeverity ?? {}

  const sevTabs = [
    { value: '', label: 'All', count: risk?.alerts?.total },
    { value: 'HIGH', label: 'High', count: bySeverity.HIGH },
    { value: 'MEDIUM', label: 'Medium', count: bySeverity.MEDIUM },
    { value: 'LOW', label: 'Low', count: bySeverity.LOW },
  ]

  const meta = null

  const handleTakeAction = useCallback((alert) => {
    setInterventionAlert(alert)
    setShowModal(true)
  }, [])

  const handleCreated = useCallback(() => {
    reloadAlerts()
  }, [reloadAlerts])

  return (
    <AnalyticsShell title="Alerts" meta={meta}>
      <FilterBar filters={filters} setFilter={setFilter} showClass showSection />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard icon={AlertTriangle} label="Total alerts" value={risk?.alerts?.total} />
        <KpiCard icon={ShieldAlert} label="High severity" value={bySeverity.HIGH} className="border-coral/30" />
        <KpiCard icon={Users} label="At-risk students" value={risk?.students?.atRisk} />
        <KpiCard icon={ClipboardList} label="Open" value={risk?.interventions?.byStatus?.OPEN} />
        <KpiCard icon={ClipboardList} label="In progress" value={risk?.interventions?.byStatus?.IN_PROGRESS} />
        <KpiCard icon={Clock} label="Overdue" value={risk?.interventions?.overdue} />
      </div>

      {risk?.students?.topMultipleRisk?.length > 0 && (
        <Card className="p-5 mb-6">
          <h3 className="font-display font-semibold text-ink mb-3">Students with multiple risks</h3>
          <div className="space-y-2">
            {risk.students.topMultipleRisk.map((s) => (
              <div key={s.studentId} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-ink">{s.name}</span>
                  <span className="text-ink/50 ml-2">{s.className} · {s.sectionName}</span>
                </div>
                <div className="flex gap-1.5">
                  {s.riskTypes.map((t) => (
                    <Badge key={t} tone="danger">{alertTypeLabel(t)}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Tabs options={sevTabs} value={severityTab} onChange={setSeverityTab} />
        <select
          className={`${selectClass} w-52`}
          value={alertType}
          onChange={(e) => setAlertType(e.target.value)}
        >
          <option value="">All types</option>
          {ALERT_TYPES.map((t) => (
            <option key={t} value={t}>{alertTypeLabel(t)}</option>
          ))}
        </select>
      </div>

      <AsyncContent
        loading={alertsLoading && !alertsData}
        error={alertsError}
        empty={alerts.length === 0}
        emptyState={
          <div className="text-center py-12 text-sm text-ink/50">
            {alertsError?.includes('500') || riskError?.includes('500')
              ? 'Alerts require the analytics_interventions migration. Please run it and try again.'
              : 'No alerts for this period.'}
          </div>
        }
      >
        <div className="space-y-3">
          {alerts.map((a) => (
            <AlertCard key={a.key} alert={a} onTakeAction={handleTakeAction} />
          ))}
        </div>
      </AsyncContent>

      {alertsData?.notAvailable && Object.keys(alertsData.notAvailable).length > 0 && (
        <div className="mt-4 text-sm text-ink/40">
          Not available: {Object.keys(alertsData.notAvailable).map((k) => alertTypeLabel(k)).join(', ')}
        </div>
      )}

      <CreateInterventionModal
        open={showModal}
        onClose={() => { setShowModal(false); setInterventionAlert(null) }}
        alert={interventionAlert}
        onCreated={handleCreated}
      />
    </AnalyticsShell>
  )
}

export { CreateInterventionModal }
