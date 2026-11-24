import { useState } from 'react'
import { ArrowRight, ArrowLeft, CheckCircle2, Users, Loader2 } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Button, Card, Badge, Alert, selectClass, inputClass } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage, getErrorCode } from '../../../api/httpClient.js'
import { useClasses } from '../classes/useClasses.js'
import { useAcademicSessions } from '../academicSessions/useAcademicSessions.js'
import { promotionsApi } from './promotions.api.js'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  { key: 'select', label: 'Select Classes' },
  { key: 'preview', label: 'Preview & Select' },
  { key: 'result', label: 'Confirmation' },
]

function Stepper({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={step.key} className="flex items-center gap-2">
            {i > 0 && <div className={`w-8 sm:w-16 h-0.5 ${done ? 'bg-board' : 'bg-line'}`} />}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                done ? 'bg-board text-on-board' : active ? 'bg-board text-on-board' : 'bg-line text-ink/40'
              }`}>
                {done ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={`text-sm font-semibold hidden sm:block ${active ? 'text-ink' : 'text-ink/45'}`}>{step.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PromotionsPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { classes, sectionsOf } = useClasses()
  const { sessions } = useAcademicSessions()

  const [step, setStep] = useState(0)

  const [academicSessionId, setAcademicSessionId] = useState('')
  const [fromClassId, setFromClassId] = useState('')
  const [fromSectionId, setFromSectionId] = useState('')
  const [toClassId, setToClassId] = useState('')
  const [toSectionId, setToSectionId] = useState('')

  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const fromClass = classes.find((c) => c.id === fromClassId)
  const fromSections = fromClassId ? sectionsOf(fromClassId) : []
  const toSections = toClassId ? sectionsOf(toClassId) : []
  const eligibleToClasses = fromClass
    ? classes.filter((c) => c.numericLevel > fromClass.numericLevel)
    : []

  const handleFromClassChange = (val) => {
    setFromClassId(val)
    setFromSectionId('')
    setToClassId('')
    setToSectionId('')
  }

  const handleToClassChange = (val) => {
    setToClassId(val)
    setToSectionId('')
  }

  const canPreview = academicSessionId && fromClassId && toClassId && toSectionId

  const handlePreview = async () => {
    setLoading(true)
    setError('')
    try {
      const body = {
        fromClassId,
        fromSectionId: fromSectionId || undefined,
        toClassId,
        toSectionId,
        academicSessionId,
      }
      const data = await promotionsApi.preview(body)
      setPreviewData(data)
      setSelected(new Set(data.students.map((s) => s.id)))
      setStep(1)
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'ALREADY_PROMOTED') {
        setError('Some students have already been promoted in this session.')
      } else if (code === 'INVALID_PROMOTION_TARGET') {
        setError('Target class must be higher than the source class.')
      } else {
        setError(getErrorMessage(err, 'Could not load preview.'))
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleStudent = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === previewData.students.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(previewData.students.map((s) => s.id)))
    }
  }

  const handlePromote = async () => {
    setLoading(true)
    setError('')
    try {
      const body = {
        fromClassId,
        fromSectionId: fromSectionId || undefined,
        toClassId,
        toSectionId,
        academicSessionId,
        studentIds: [...selected],
      }
      const data = await promotionsApi.execute(body)
      setResult(data)
      setStep(2)
      notify(`${data.promotedCount} students promoted successfully!`, 'success')
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'ALREADY_PROMOTED') {
        setError('Some selected students were already promoted in this session.')
      } else {
        setError(getErrorMessage(err, 'Promotion failed.'))
      }
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(0)
    setPreviewData(null)
    setSelected(new Set())
    setResult(null)
    setError('')
  }

  return (
    <AppShell title="Student Promotion" subtitle="Promote students from one class to another">
      <Stepper current={step} />

      {error && <Alert className="mb-4">{error}</Alert>}

      {step === 0 && (
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="text-sm font-semibold text-ink/80 block mb-1.5">Academic Session <span className="text-coral">*</span></label>
              <select className={selectClass} value={academicSessionId} onChange={(e) => setAcademicSessionId(e.target.value)}>
                <option value="">Select session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (Current)' : ''}</option>
                ))}
              </select>
            </div>

            <div />

            <div>
              <label className="text-sm font-semibold text-ink/80 block mb-1.5">From Class <span className="text-coral">*</span></label>
              <select className={selectClass} value={fromClassId} onChange={(e) => handleFromClassChange(e.target.value)}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink/80 block mb-1.5">From Section <span className="text-ink/40">(optional)</span></label>
              <select className={selectClass} value={fromSectionId} onChange={(e) => setFromSectionId(e.target.value)} disabled={!fromClassId}>
                <option value="">All sections</option>
                {fromSections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink/80 block mb-1.5">To Class <span className="text-coral">*</span></label>
              <select className={selectClass} value={toClassId} onChange={(e) => handleToClassChange(e.target.value)} disabled={!fromClassId}>
                <option value="">Select class</option>
                {eligibleToClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {fromClassId && eligibleToClasses.length === 0 && (
                <p className="text-xs text-coral mt-1">No higher class available.</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-ink/80 block mb-1.5">To Section <span className="text-coral">*</span></label>
              <select className={selectClass} value={toSectionId} onChange={(e) => setToSectionId(e.target.value)} disabled={!toClassId}>
                <option value="">Select section</option>
                {toSections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button icon={ArrowRight} onClick={handlePreview} disabled={!canPreview} loading={loading}>
              Preview
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && previewData && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink/70">
                <span className="font-semibold text-ink">{selected.size}</span> of{' '}
                <span className="font-semibold text-ink">{previewData.studentsCount}</span>{' '}
                students will be promoted from{' '}
                <span className="font-semibold text-ink">{previewData.fromClass.name}</span>{' '}
                to{' '}
                <span className="font-semibold text-ink">{previewData.toClass.name} – {previewData.toSection.name}</span>
              </p>
            </div>
            <Badge tone="info">{selected.size} selected</Badge>
          </div>

          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface sticky top-0">
                <tr className="border-b border-line">
                  <th className="px-5 py-3 text-left">
                    <input type="checkbox" checked={selected.size === previewData.students.length} onChange={toggleAll} className="w-4 h-4 rounded border-line text-board" />
                  </th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-ink/45 font-semibold">Student</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-ink/45 font-semibold">Admission No</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-ink/45 font-semibold">Current Class</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-ink/45 font-semibold">Current Roll</th>
                  <th className="px-5 py-3 text-left text-xs uppercase tracking-wide text-ink/45 font-semibold">New Roll</th>
                </tr>
              </thead>
              <tbody>
                {previewData.students.map((s) => (
                  <tr key={s.id} className={`border-b border-line last:border-0 hover:bg-line/20 ${!selected.has(s.id) ? 'opacity-40' : ''}`}>
                    <td className="px-5 py-3.5">
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleStudent(s.id)} className="w-4 h-4 rounded border-line text-board" />
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-ink">{s.name}</td>
                    <td className="px-5 py-3.5 text-ink/70">{s.admissionNo}</td>
                    <td className="px-5 py-3.5 text-ink/70">{s.currentClass}{s.currentSection ? ` – ${s.currentSection}` : ''}</td>
                    <td className="px-5 py-3.5 text-ink/70">{s.currentRollNo ?? '—'}</td>
                    <td className="px-5 py-3.5 text-ink/70">{s.newRollNo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-line flex items-center justify-between gap-3">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => setStep(0)}>Back</Button>
            <Button onClick={handlePromote} loading={loading} disabled={selected.size === 0}>
              Promote {selected.size} student{selected.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && result && (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-board/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-board" />
          </div>
          <h2 className="font-display text-xl font-semibold text-ink mb-2">Promotion Complete</h2>
          <p className="text-ink/65 mb-1">
            <span className="font-semibold text-ink">{result.promotedCount}</span> students promoted from{' '}
            <span className="font-semibold text-ink">{result.fromClass.name}</span> to{' '}
            <span className="font-semibold text-ink">{result.toClass.name} – {result.toSection.name}</span>
          </p>
          <p className="text-sm text-ink/45 mb-6">Roll numbers start from {result.startRollNo}.</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/promotions/history')}>View History</Button>
            <Button onClick={reset}>Promote More</Button>
          </div>
        </Card>
      )}
    </AppShell>
  )
}
