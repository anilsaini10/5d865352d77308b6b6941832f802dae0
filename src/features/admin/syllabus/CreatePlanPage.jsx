import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, Button, Card, Field, inputClass, selectClass } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'
import { useClasses } from '../classes/useClasses.js'
import { subjectsApi } from '../subjects/subjects.api.js'
import { teachersApi } from '../teachers/teachers.api.js'
import { chaptersApi, plansApi } from './syllabus.api.js'
import { validatePlanForm, planFormToPayload } from './syllabus.validation.js'
import { currentSessionYear } from './syllabus.constants.js'

export default function CreatePlanPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { classes, sectionsOf } = useClasses()

  const [sessionYear, setSessionYear] = useState(String(currentSessionYear()))
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [remarks, setRemarks] = useState('')
  const [approvalEnabled, setApprovalEnabled] = useState(false)

  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [availableChapters, setAvailableChapters] = useState([])
  const [selectedChapters, setSelectedChapters] = useState([])

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    teachersApi.listAll().then(setTeachers).catch(() => {})
  }, [])

  useEffect(() => {
    if (!classId) { setSubjects([]); setSubjectId(''); return }
    subjectsApi.byClass(classId).then(setSubjects).catch(() => setSubjects([]))
  }, [classId])

  useEffect(() => {
    if (!classId || !subjectId) { setAvailableChapters([]); setSelectedChapters([]); return }
    chaptersApi.list({ classId, subjectId, isActive: true, pageSize: 100 })
      .then((res) => setAvailableChapters(res.items ?? []))
      .catch(() => setAvailableChapters([]))
    setSelectedChapters([])
  }, [classId, subjectId])

  const sections = sectionsOf(classId)

  const toggleChapter = (ch) => {
    setSelectedChapters((prev) => {
      const exists = prev.find((s) => s.chapterId === ch.id)
      if (exists) return prev.filter((s) => s.chapterId !== ch.id)
      return [
        ...prev,
        {
          chapterId: ch.id,
          name: ch.name,
          chapterNumber: ch.chapterNumber,
          sequenceNumber: prev.length + 1,
          expectedWorkingDays: String(ch.expectedWorkingDays || 0),
          plannedStartDate: '',
          plannedEndDate: '',
          adminRemarks: '',
        },
      ]
    })
  }

  const updateChapterField = (chapterId, field, value) => {
    setSelectedChapters((prev) =>
      prev.map((ch) => (ch.chapterId === chapterId ? { ...ch, [field]: value } : ch))
    )
  }

  const handleClassChange = (value) => {
    setClassId(value)
    setSectionId('')
    setSubjectId('')
    setSelectedChapters([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')

    const form = {
      sessionYear,
      classId,
      sectionId,
      subjectId,
      teacherId,
      remarks,
      approvalEnabled,
      chapters: selectedChapters.map((ch, i) => ({
        chapterId: ch.chapterId,
        sequenceNumber: Number(ch.sequenceNumber) || i + 1,
        expectedWorkingDays: Number(ch.expectedWorkingDays || 0),
        plannedStartDate: ch.plannedStartDate || undefined,
        plannedEndDate: ch.plannedEndDate || undefined,
        adminRemarks: ch.adminRemarks?.trim() || undefined,
      })),
    }

    const validationErrors = validatePlanForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})

    setSubmitting(true)
    try {
      const result = await plansApi.create(planFormToPayload(form))
      notify('Syllabus plan created.', 'success')
      navigate(`/syllabus/plans/${result.id}`)
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'PLAN_ALREADY_EXISTS') {
        setApiError('A syllabus plan already exists for this class, section, and subject combination for the selected year.')
      } else {
        setApiError(getErrorMessage(err, 'Could not create plan.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell title="Create Syllabus Plan" onBack={() => navigate(-1)}>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {apiError && <Alert tone="error">{apiError}</Alert>}

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-4">Basic Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Session Year" required error={errors.sessionYear}>
              <input type="number" className={inputClass} value={sessionYear} onChange={(e) => setSessionYear(e.target.value)} min="2000" max="2100" />
            </Field>
            <Field label="Class" required error={errors.classId}>
              <select className={selectClass} value={classId} onChange={(e) => handleClassChange(e.target.value)}>
                <option value="">Select class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Section" required error={errors.sectionId}>
              <select className={selectClass} value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId}>
                <option value="">Select section</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Subject" required error={errors.subjectId}>
              <select className={selectClass} value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setSelectedChapters([]) }} disabled={!classId}>
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Teacher" hint="Optional — assign later">
              <select className={selectClass} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">None</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.employeeId})</option>)}
              </select>
            </Field>
            <Field label="Remarks" hint="Optional, max 1000 chars">
              <textarea className={inputClass} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={1000} />
            </Field>
            <label className="flex items-center gap-2.5 sm:col-span-2 cursor-pointer select-none">
              <input type="checkbox" checked={approvalEnabled} onChange={(e) => setApprovalEnabled(e.target.checked)} className="rounded border-line text-board focus:ring-board/20 w-4 h-4" />
              <span className="text-sm font-semibold text-ink/80">Require admin approval for teacher progress updates</span>
            </label>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-1">Chapters</h3>
          {errors.chapters && <p className="text-xs text-coral font-medium mb-3">{errors.chapters}</p>}

          {!classId || !subjectId ? (
            <p className="text-sm text-ink/50 py-4">Select a class and subject to load available chapters.</p>
          ) : availableChapters.length === 0 ? (
            <p className="text-sm text-ink/50 py-4">No chapters found for this class and subject. Create chapters first.</p>
          ) : (
            <div className="space-y-3 mt-3">
              {availableChapters
                .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                .map((ch) => {
                  const selected = selectedChapters.find((s) => s.chapterId === ch.id)
                  return (
                    <div key={ch.id} className={`border rounded-xl p-4 transition-colors ${selected ? 'border-board bg-board/5' : 'border-line'}`}>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => toggleChapter(ch)}
                          className="rounded border-line text-board focus:ring-board/20 w-4 h-4 shrink-0"
                        />
                        <span className="text-sm font-semibold text-ink">
                          Ch {ch.chapterNumber}. {ch.name}
                        </span>
                        {ch.description && <span className="text-xs text-ink/45 hidden sm:inline">— {ch.description.slice(0, 60)}</span>}
                      </label>

                      {selected && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 ml-7">
                          <Field label="Seq #">
                            <input
                              type="number"
                              className={inputClass}
                              value={selected.sequenceNumber}
                              onChange={(e) => updateChapterField(ch.id, 'sequenceNumber', e.target.value)}
                              min={1}
                            />
                          </Field>
                          <Field label="Expected Days">
                            <input
                              type="number"
                              className={inputClass}
                              value={selected.expectedWorkingDays}
                              onChange={(e) => updateChapterField(ch.id, 'expectedWorkingDays', e.target.value)}
                              min={0}
                            />
                          </Field>
                          <Field label="Start Date">
                            <input
                              type="date"
                              className={inputClass}
                              value={selected.plannedStartDate}
                              onChange={(e) => updateChapterField(ch.id, 'plannedStartDate', e.target.value)}
                            />
                          </Field>
                          <Field label="End Date">
                            <input
                              type="date"
                              className={inputClass}
                              value={selected.plannedEndDate}
                              onChange={(e) => updateChapterField(ch.id, 'plannedEndDate', e.target.value)}
                            />
                          </Field>
                          <Field label="Remarks">
                            <input
                              type="text"
                              className={inputClass}
                              value={selected.adminRemarks}
                              onChange={(e) => updateChapterField(ch.id, 'adminRemarks', e.target.value)}
                              maxLength={500}
                              placeholder="Optional"
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" icon={Save} loading={submitting}>
            Create Plan ({selectedChapters.length} chapter{selectedChapters.length !== 1 ? 's' : ''})
          </Button>
        </div>
      </form>
    </AppShell>
  )
}
