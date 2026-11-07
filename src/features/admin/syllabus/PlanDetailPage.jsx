import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Trash2, ShieldCheck } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import {
  AsyncContent, Badge, Button, Card, ConfirmDialog, IconButton,
  Modal, Field, inputClass, selectClass, FormActions,
  Table, THead, Th, Tr, Td,
} from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { formatDay } from '../../../utils/format.js'
import { plansApi, approvalsApi } from './syllabus.api.js'
import { teachersApi } from '../teachers/teachers.api.js'
import { STATUS_TONE, STATUS_LABEL, PLAN_STATUS_OPTIONS, sessionYearLabel } from './syllabus.constants.js'
import { validateCorrectionForm } from './syllabus.validation.js'
import PlanChapterEditModal from './components/PlanChapterEditModal.jsx'

function SummaryCard({ label, value, accent }) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-4">
      <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent || 'text-ink'}`}>{value}</p>
    </div>
  )
}

function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, value ?? 0))
  const color = pct >= 75 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-coral'
  return (
    <div className="w-full bg-line/50 rounded-full h-2 mt-1">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function PlanDetailPage() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  const { data: plan, loading, error, reload } = useFetch(() => plansApi.get(planId), [planId], { errorMessage: 'Could not load plan.' })

  // Edit plan modal
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editSubmitting, setEditSubmitting] = useState(false)
  const { data: allTeachers } = useFetch(() => teachersApi.listAll(), [])

  const openEdit = () => {
    setEditForm({
      teacherId: plan.teacherId ?? '',
      status: plan.status ?? 'DRAFT',
      remarks: plan.remarks ?? '',
      approvalEnabled: plan.approvalEnabled ?? false,
    })
    setEditOpen(true)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    setEditSubmitting(true)
    try {
      const body = {}
      if (editForm.teacherId !== (plan.teacherId ?? '')) body.teacherId = editForm.teacherId || null
      if (editForm.status !== plan.status) body.status = editForm.status
      if (editForm.remarks !== (plan.remarks ?? '')) body.remarks = editForm.remarks
      if (editForm.approvalEnabled !== plan.approvalEnabled) body.approvalEnabled = editForm.approvalEnabled
      if (Object.keys(body).length) await plansApi.update(planId, body)
      notify('Plan updated.', 'success')
      setEditOpen(false)
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not update plan.'), 'error')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Delete plan
  const [deleteOpen, setDeleteOpen] = useState(false)
  const handleDelete = async () => {
    try {
      await plansApi.remove(planId)
      notify('Plan deleted.', 'success')
      navigate('/syllabus/plans')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete plan.'), 'error')
    }
  }

  // Chapter edit modal
  const [chapterEdit, setChapterEdit] = useState(null)

  // Admin correction
  const [corrTarget, setCorrTarget] = useState(null)
  const [corrForm, setCorrForm] = useState({ completionPercentage: '', correctionRemarks: '' })
  const [corrErrors, setCorrErrors] = useState({})
  const [corrBusy, setCorrBusy] = useState(false)

  const openCorrection = (ch) => {
    setCorrTarget(ch)
    setCorrForm({ completionPercentage: String(ch.completionPercentage ?? 0), correctionRemarks: '' })
    setCorrErrors({})
  }

  const submitCorrection = async (e) => {
    e.preventDefault()
    const errs = validateCorrectionForm(corrForm)
    if (Object.keys(errs).length) { setCorrErrors(errs); return }
    setCorrBusy(true)
    try {
      await approvalsApi.correct(corrTarget.id, {
        completionPercentage: Number(corrForm.completionPercentage),
        correctionRemarks: corrForm.correctionRemarks.trim(),
      })
      notify('Progress corrected.', 'success')
      setCorrTarget(null)
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not correct progress.'), 'error')
    } finally {
      setCorrBusy(false)
    }
  }

  const title = plan ? `${plan.class?.name} ${plan.section?.name} — ${plan.subject?.name}` : 'Plan Detail'
  const subtitle = plan ? sessionYearLabel(plan.sessionYear) : ''

  return (
    <AppShell title={title} subtitle={subtitle} onBack={() => navigate('/syllabus/plans')}>
      <AsyncContent loading={loading} error={error} empty={!plan}>
        {plan && (
          <>
            {/* Header info */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge tone={STATUS_TONE[plan.status]}>{STATUS_LABEL[plan.status]}</Badge>
              <span className="text-sm text-ink/60">
                Teacher: <span className="font-semibold text-ink">{plan.teacher?.name ?? 'Unassigned'}</span>
              </span>
              {plan.approvalEnabled && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-board">
                  <ShieldCheck size={14} /> Approval required
                </span>
              )}
              <div className="flex-1" />
              <Button variant="secondary" icon={Pencil} size="sm" onClick={openEdit}>Edit</Button>
              <Button variant="danger-ghost" icon={Trash2} size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <SummaryCard label="Chapters" value={plan.summary?.totalChapters ?? 0} />
              <div className="bg-surface border border-line rounded-2xl p-4">
                <p className="text-xs font-semibold text-ink/45 uppercase tracking-wide">Avg Completion</p>
                <p className="text-2xl font-bold mt-1 text-ink">{plan.summary?.avgCompletion ?? 0}%</p>
                <ProgressBar value={plan.summary?.avgCompletion} />
              </div>
              <SummaryCard label="Completed" value={plan.summary?.completed ?? 0} accent="text-green-600" />
              <SummaryCard label="Delayed" value={plan.summary?.delayed ?? 0} accent={plan.summary?.delayed > 0 ? 'text-coral' : 'text-ink'} />
            </div>

            {/* Chapters table */}
            <Card className="overflow-hidden">
              <Table>
                <THead>
                  <Th>#</Th>
                  <Th>Chapter</Th>
                  <Th>Exp. Days</Th>
                  <Th>Planned</Th>
                  <Th>Actual Days</Th>
                  <Th>Completion</Th>
                  <Th>Status</Th>
                  <Th>Schedule</Th>
                  <Th className="text-right">Actions</Th>
                </THead>
                <tbody>
                  {(plan.chapters ?? []).map((ch) => (
                    <Tr key={ch.id}>
                      <Td className="font-semibold text-ink">{ch.sequenceNumber}</Td>
                      <Td>
                        <span className="block font-semibold text-ink">{ch.chapter?.name}</span>
                        <span className="text-xs text-ink/50">Ch. {ch.chapter?.chapterNumber}</span>
                      </Td>
                      <Td>{ch.expectedWorkingDays}</Td>
                      <Td className="whitespace-nowrap text-xs">
                        {ch.plannedStartDate || ch.plannedEndDate ? (
                          <>
                            {formatDay(ch.plannedStartDate)}
                            {ch.plannedEndDate ? ` – ${formatDay(ch.plannedEndDate)}` : ''}
                          </>
                        ) : '—'}
                      </Td>
                      <Td>{ch.actualWorkingDays ?? 0}</Td>
                      <Td>
                        <span className="font-semibold text-ink">{ch.completionPercentage ?? 0}%</span>
                        <ProgressBar value={ch.completionPercentage} />
                      </Td>
                      <Td><Badge tone={STATUS_TONE[ch.status]}>{STATUS_LABEL[ch.status] ?? ch.status}</Badge></Td>
                      <Td>
                        {ch.scheduleStatus ? (
                          <Badge tone={STATUS_TONE[ch.scheduleStatus]}>{STATUS_LABEL[ch.scheduleStatus] ?? ch.scheduleStatus}</Badge>
                        ) : '—'}
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <IconButton icon={Pencil} label="Edit" tone="primary" onClick={() => setChapterEdit(ch)} />
                          <Button variant="ghost" size="sm" onClick={() => openCorrection(ch)}>Correct</Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>

            {/* Edit Plan Modal */}
            <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Plan" wide>
              <form onSubmit={saveEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Teacher">
                    <select className={selectClass} value={editForm.teacherId} onChange={(e) => setEditForm((f) => ({ ...f, teacherId: e.target.value }))}>
                      <option value="">Unassigned</option>
                      {(allTeachers ?? []).map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.employeeId})</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select className={selectClass} value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
                      {PLAN_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Remarks">
                  <textarea rows={3} maxLength={1000} className={inputClass} value={editForm.remarks} onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))} />
                </Field>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.approvalEnabled} onChange={(e) => setEditForm((f) => ({ ...f, approvalEnabled: e.target.checked }))} className="rounded border-line text-board focus:ring-board" />
                  <span className="text-sm font-semibold text-ink/80">Require admin approval for progress updates</span>
                </label>
                <FormActions onCancel={() => setEditOpen(false)} submitting={editSubmitting} />
              </form>
            </Modal>

            {/* Delete confirm */}
            <ConfirmDialog
              open={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              onConfirm={handleDelete}
              title="Delete this plan?"
              message="This will permanently delete the plan, all chapter assignments, progress history, and pending approvals. This cannot be undone."
              confirmLabel="Delete Plan"
            />

            {/* Chapter edit modal */}
            <PlanChapterEditModal
              open={!!chapterEdit}
              onClose={() => setChapterEdit(null)}
              planId={planId}
              chapter={chapterEdit}
              onSaved={reload}
            />

            {/* Admin Correction Modal */}
            <Modal open={!!corrTarget} onClose={() => setCorrTarget(null)} title="Admin Correction" subtitle={corrTarget?.chapter?.name}>
              <form onSubmit={submitCorrection} className="space-y-4">
                <Field label="Completion Percentage" required error={corrErrors.completionPercentage}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={inputClass}
                    value={corrForm.completionPercentage}
                    onChange={(e) => { setCorrForm((f) => ({ ...f, completionPercentage: e.target.value })); setCorrErrors((p) => ({ ...p, completionPercentage: undefined })) }}
                  />
                </Field>
                <Field label="Correction Remarks" required error={corrErrors.correctionRemarks}>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    className={inputClass}
                    value={corrForm.correctionRemarks}
                    onChange={(e) => { setCorrForm((f) => ({ ...f, correctionRemarks: e.target.value })); setCorrErrors((p) => ({ ...p, correctionRemarks: undefined })) }}
                    placeholder="Explain the correction..."
                  />
                </Field>
                <FormActions onCancel={() => setCorrTarget(null)} submitting={corrBusy} submitLabel="Save Correction" />
              </form>
            </Modal>
          </>
        )}
      </AsyncContent>
    </AppShell>
  )
}
