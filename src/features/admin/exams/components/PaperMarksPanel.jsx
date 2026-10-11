import { useState } from 'react'
import { AlertCircle, ArrowLeft, Save, Users } from 'lucide-react'
import { Alert, AsyncContent, Button, Card, EmptyState, SearchInput, Table, THead, Th, Tr, Td, inputClass, selectClass } from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue.js'
import { useToast } from '../../../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../../../api/httpClient.js'
import { RESULT_STATUSES } from '../../constants.js'
import { examsApi } from '../exams.api.js'
import GradingProgress from './GradingProgress.jsx'
import { formatPaperDate, formatPaperTime, isFutureDate } from './scheduleUtils.js'

const cellInput = `${inputClass} !py-1.5 !px-2.5`
const SAVE_CHUNK = 300
const GRADE_MAX = 10
const REMARKS_MAX = 500

const originalValues = (mark) => ({
  status: mark?.status ?? 'PENDING',
  marks: mark?.marksObtained != null ? String(mark.marksObtained) : '',
  grade: mark?.grade ?? '',
  remarks: mark?.remarks ?? '',
})

/** Fields that differ from the saved mark, in API shape. Empty object = unchanged. */
function changedFields(values, mark) {
  const before = originalValues(mark)
  const changed = {}
  if (values.status !== before.status) changed.status = values.status
  if (values.status === 'GRADED' && values.marks.trim() !== before.marks) changed.marksObtained = Number(values.marks)
  if (values.grade.trim() !== before.grade.trim()) changed.grade = values.grade.trim() || null
  if (values.remarks.trim() !== before.remarks.trim()) changed.remarks = values.remarks.trim() || null
  return changed
}

function validate(values, maxMarks) {
  if (values.status !== 'GRADED') return ''
  const raw = values.marks.trim()
  if (raw === '') return 'Enter marks for a graded student.'
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > maxMarks) return `Marks must be between 0 and ${maxMarks}.`
  return ''
}

function Stat({ label, value, tone = 'text-ink' }) {
  return (
    <div>
      <p className="text-xs text-ink/45">{label}</p>
      <p className={`text-lg font-display font-semibold ${tone}`}>{value ?? '—'}</p>
    </div>
  )
}

export default function PaperMarksPanel({ examId, paper: listPaper, classes, onBack, onChanged, onStale }) {
  const { notify } = useToast()
  const [sectionId, setSectionId] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const { data, setData, loading, error, reload } = useFetch(
    () => examsApi.paperStudents(examId, listPaper.id, { sectionId, search: debouncedSearch }),
    [examId, listPaper.id, sectionId, debouncedSearch],
    { errorMessage: 'Could not load students for this paper.' }
  )

  // Drafts keyed by studentId survive filtering/searching.
  const [drafts, setDrafts] = useState({})
  const [rowErrors, setRowErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const paper = data?.paper ?? listPaper
  const maxMarks = paper.maxMarks
  const readOnly = isFutureDate(paper.date)
  const sections = classes.find((c) => c.id === paper.classId)?.sections ?? []
  const items = data?.items ?? []
  const summary = data?.summary

  const dirty = Object.entries(drafts).filter(([, d]) => Object.keys(changedFields(d.values, d.row.mark)).length > 0)

  const update = (row, patch) => {
    setDrafts((d) => ({ ...d, [row.studentId]: { row, values: { ...(d[row.studentId]?.values ?? originalValues(row.mark)), ...patch } } }))
    setRowErrors((e) => ({ ...e, [row.studentId]: undefined }))
  }
  const onStatus = (row, status) => update(row, status === 'GRADED' ? { status } : { status, marks: '' })
  const onMarks = (row, marks) => update(row, marks === '' ? { marks } : { marks, status: 'GRADED' })

  const save = async () => {
    const errs = {}
    dirty.forEach(([id, d]) => {
      const msg = validate(d.values, maxMarks)
      if (msg) errs[id] = msg
    })
    setRowErrors(errs)
    if (Object.keys(errs).length > 0) {
      notify('Fix the highlighted rows before saving.', 'error')
      return
    }

    const payload = dirty.map(([studentId, d]) => ({ studentId, status: d.values.status, ...changedFields(d.values, d.row.mark) }))
    setSaving(true)
    try {
      let last
      for (let i = 0; i < payload.length; i += SAVE_CHUNK) last = await examsApi.savePaperMarks(examId, paper.id, payload.slice(i, i + SAVE_CHUNK))
      const fresh = new Map((last?.items ?? []).map((it) => [it.studentId, it]))
      setData((cur) => cur && { ...cur, paper: last?.paper ?? cur.paper, summary: last?.summary ?? cur.summary, items: cur.items.map((it) => fresh.get(it.studentId) ?? it) })
      setDrafts({})
      setRowErrors({})
      notify(`Saved marks for ${payload.length} student${payload.length === 1 ? '' : 's'}.`, 'success')
      onChanged()
      if (!last?.items?.length) reload()
    } catch (err) {
      const code = getErrorCode(err)
      const details = err?.response?.data?.error?.details ?? {}
      const message = getErrorMessage(err, 'Could not save marks.')
      if (code === 'INVALID_MARKS' || code === 'STUDENT_NOT_IN_CLASS') {
        const rowMsg = code === 'INVALID_MARKS' ? `Marks must be between 0 and ${details.maxMarks ?? maxMarks}.` : 'This student is not in this class.'
        setRowErrors(Object.fromEntries((details.studentIds ?? []).map((id) => [id, rowMsg])))
        notify(message, 'error')
        if (code === 'STUDENT_NOT_IN_CLASS') reload()
      } else if (code === 'EXAM_NOT_HELD_YET') {
        notify(`Marks can be entered from ${formatPaperDate(details.date ?? paper.date)}.`, 'error')
        reload()
      } else if (['EXAM_NOT_FOUND', 'EXAM_SCHEDULE_NOT_FOUND', 'SECTION_NOT_FOUND'].includes(code)) {
        notify(message, 'error')
        onStale()
      } else {
        notify(message, 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const marked = summary ? summary.graded + summary.absent : listPaper.markedCount ?? 0
  const total = summary?.totalStudents ?? 0

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-semibold text-board hover:underline mb-2">
            <ArrowLeft size={14} /> All papers
          </button>
          <h2 className="font-display text-xl font-semibold text-ink">{paper.className} · {paper.subjectName}</h2>
          <p className="text-sm text-ink/55">{formatPaperDate(paper.date, { weekday: true })} · {formatPaperTime(paper)} · Max marks: <span className="font-semibold text-ink">{maxMarks}</span></p>
        </div>
        <Button icon={Save} onClick={save} loading={saving} disabled={readOnly || dirty.length === 0}>
          Save{dirty.length > 0 ? ` (${dirty.length})` : ''}
        </Button>
      </div>

      {readOnly && <Alert tone="info" className="mb-4">Marks can be entered from {formatPaperDate(paper.date)}.</Alert>}

      <Card className="p-5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1 min-w-0">{summary ? <GradingProgress graded={marked} total={total} label="marked" /> : <p className="text-sm text-ink/50">Loading summary…</p>}</div>
          <div className="grid grid-cols-4 gap-6 md:pl-6 md:border-l md:border-line">
            <Stat label="Students" value={summary?.totalStudents} />
            <Stat label="Graded" value={summary?.graded} tone="text-success" />
            <Stat label="Absent" value={summary?.absent} tone="text-coral" />
            <Stat label="Pending" value={summary?.pending} tone="text-chalk-ink" />
          </div>
        </div>
        <p className="text-xs text-ink/45 mt-3">Teachers enter marks for their own sections from the teacher app. Changes here override theirs. Absent and Pending clear the marks.</p>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or admission no…" />
        <select aria-label="Filter by section" className={`${selectClass} sm:w-44`} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
          <option value="">All sections</option>
          {sections.map((s) => <option key={s.id} value={s.id}>Section {s.name}</option>)}
        </select>
      </div>

      <Card>
        <AsyncContent
          loading={loading && !data}
          error={error}
          empty={items.length === 0}
          emptyState={<EmptyState icon={Users} title={debouncedSearch || sectionId ? 'No matching students' : 'No students in this class'} message="Try a different search or section." />}
        >
          <Table className={loading ? 'opacity-60' : ''}>
            <THead>
              <Th>Roll</Th><Th>Name</Th><Th>Section</Th><Th>Status</Th><Th>Marks / {maxMarks}</Th><Th>Grade</Th><Th>Remarks</Th>
            </THead>
            <tbody>
              {items.map((row) => {
                const values = drafts[row.studentId]?.values ?? originalValues(row.mark)
                const err = rowErrors[row.studentId]
                const isDirty = !!drafts[row.studentId] && Object.keys(changedFields(values, row.mark)).length > 0
                const off = readOnly || saving
                return (
                  <Tr key={row.studentId} className={err ? 'bg-coral/5' : isDirty ? 'bg-chalk/10' : ''}>
                    <Td className="whitespace-nowrap">{row.rollNo ?? '—'}</Td>
                    <Td className="min-w-[160px]">
                      <p className="font-semibold text-ink">{row.name}</p>
                      {row.admissionNo && <p className="text-xs text-ink/45">{row.admissionNo}</p>}
                      {err && <p className="mt-1 inline-flex items-start gap-1 text-xs text-coral font-medium"><AlertCircle size={13} className="shrink-0 mt-0.5" />{err}</p>}
                    </Td>
                    <Td>{row.sectionName ?? '—'}</Td>
                    <Td>
                      <select aria-label={`Status for ${row.name}`} className={`${selectClass} !py-1.5 !px-2.5 w-28`} value={values.status} disabled={off} onChange={(e) => onStatus(row, e.target.value)}>
                        {RESULT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </Td>
                    <Td>
                      <input
                        type="number" min="0" max={maxMarks} step="any" inputMode="decimal"
                        aria-label={`Marks for ${row.name}`}
                        className={`${cellInput} w-24`}
                        value={values.marks}
                        disabled={off || values.status !== 'GRADED'}
                        placeholder={values.status === 'GRADED' ? '' : '—'}
                        onChange={(e) => onMarks(row, e.target.value)}
                      />
                    </Td>
                    <Td><input aria-label={`Grade for ${row.name}`} className={`${cellInput} w-20`} value={values.grade} maxLength={GRADE_MAX} disabled={off} placeholder="A+" onChange={(e) => update(row, { grade: e.target.value })} /></Td>
                    <Td><input aria-label={`Remarks for ${row.name}`} className={`${cellInput} min-w-[180px]`} value={values.remarks} maxLength={REMARKS_MAX} disabled={off} placeholder="Optional" onChange={(e) => update(row, { remarks: e.target.value })} /></Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {dirty.some(([id]) => !items.some((it) => it.studentId === id)) && (
        <Alert tone="warning" className="mt-4">Some unsaved changes are hidden by your search or section filter. Save sends them too.</Alert>
      )}
    </>
  )
}
