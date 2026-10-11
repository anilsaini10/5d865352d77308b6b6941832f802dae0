import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Modal, Field, inputClass, selectClass, Alert, Button, IconButton } from '../../../../components/ui.jsx'
import { examsApi } from '../exams.api.js'
import TeacherSelect from './TeacherSelect.jsx'
import { examRange, paperError, timesOverlap, validatePaperFields } from './scheduleUtils.js'

const cell = `${inputClass} !py-1.5 !px-2.5`

const rowsFor = (cls, examClass, papers) => {
  const taken = new Set(papers.filter((p) => p.classId === cls.id).map((p) => p.subjectId))
  return (cls.subjects ?? [])
    .filter((s) => !taken.has(s.id))
    .map((s) => ({ key: s.id, subjectId: s.id, subjectName: s.name, date: '', startTime: '', endTime: '', maxMarks: String(examClass.maxMarks ?? ''), roomNo: '', invigilator: null }))
}

/** Builds a whole class's date sheet in one all-or-nothing request. */
export default function BulkDateSheetModal({ open, onClose, examId, exam, examClasses, classes, papers, initialClassId, onSaved }) {
  const [classId, setClassId] = useState('')
  const [rows, setRows] = useState([])
  const [rowErrors, setRowErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bulkTime, setBulkTime] = useState({ startTime: '', endTime: '' })

  const pickClass = (id) => {
    setClassId(id)
    setRowErrors({})
    setServerError('')
    const cls = classes.find((c) => c.id === id)
    const examClass = examClasses.find((c) => c.classId === id)
    setRows(cls && examClass ? rowsFor(cls, examClass, papers) : [])
  }

  useEffect(() => {
    if (!open) return
    setBulkTime({ startTime: '', endTime: '' })
    pickClass(initialClassId && examClasses.some((c) => c.classId === initialClassId) ? initialClassId : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const range = examRange(exam)
  const patchRow = (key, patch) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
    setRowErrors((e) => ({ ...e, [key]: undefined }))
    setServerError('')
  }
  const removeRow = (key) => setRows((rs) => rs.filter((r) => r.key !== key))
  const applyTimeToAll = () => setRows((rs) => rs.map((r) => ({ ...r, ...(bulkTime.startTime && { startTime: bulkTime.startTime }), ...(bulkTime.endTime && { endTime: bulkTime.endTime }) })))

  const validate = () => {
    const errs = {}
    rows.forEach((r) => {
      const v = validatePaperFields(r, exam)
      const first = Object.values(v)[0]
      if (first) errs[r.key] = first
    })
    // Same class, same day, overlapping times — the server re-checks, this just saves a round trip.
    rows.forEach((a, i) => {
      rows.slice(i + 1).forEach((b) => {
        if (a.date && a.date === b.date && a.startTime && a.endTime && b.startTime && b.endTime && timesOverlap(a, b)) {
          const msg = (other) => `Overlaps with ${other.subjectName} on the same day.`
          errs[a.key] ??= msg(b)
          errs[b.key] ??= msg(a)
        }
      })
    })
    return errs
  }

  const submit = async () => {
    setServerError('')
    if (rows.length === 0) return
    const errs = validate()
    setRowErrors(errs)
    if (Object.keys(errs).length > 0) {
      setServerError('Fix the highlighted rows and try again.')
      return
    }
    const payload = rows.map((r) => {
      const p = { classId, subjectId: r.subjectId, date: r.date, startTime: r.startTime, endTime: r.endTime, maxMarks: Number(r.maxMarks) }
      if (r.roomNo.trim()) p.roomNo = r.roomNo.trim()
      if (r.invigilator) p.invigilatorId = r.invigilator.id
      return p
    })
    setSubmitting(true)
    try {
      const res = await examsApi.createPapersBulk(examId, payload)
      onSaved(res?.items?.length ?? payload.length)
      onClose()
    } catch (err) {
      const pe = paperError(err, 'Could not save the date sheet.')
      if (pe.paperIndex != null && rows[pe.paperIndex]) {
        setRowErrors({ [rows[pe.paperIndex].key]: pe.message })
        setServerError('Nothing was saved. Fix the highlighted row and save again.')
      } else {
        setServerError(`${pe.message} Nothing was saved.`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const skipped = classId ? (classes.find((c) => c.id === classId)?.subjects ?? []).length - rows.length : 0

  return (
    <Modal open={open} onClose={onClose} wide="xl" title="Create date sheet for a class" subtitle={`${exam?.title ?? ''} · all papers are saved together`}>
      <div className="space-y-4">
        <Field label="Class" required>
          <select className={`${selectClass} sm:max-w-xs`} value={classId} onChange={(e) => pickClass(e.target.value)}>
            <option value="">Select a class</option>
            {examClasses.map((c) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
          </select>
        </Field>

        {classId && rows.length === 0 && <Alert tone="info">Every subject of this class already has a paper in this exam.</Alert>}

        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-line/20 p-3">
              <span className="text-xs font-semibold text-ink/60 w-full sm:w-auto sm:pb-2.5">Same time for all rows</span>
              <input type="time" aria-label="Start time for all" className={`${cell} w-32`} value={bulkTime.startTime} onChange={(e) => setBulkTime((t) => ({ ...t, startTime: e.target.value }))} />
              <input type="time" aria-label="End time for all" className={`${cell} w-32`} value={bulkTime.endTime} onChange={(e) => setBulkTime((t) => ({ ...t, endTime: e.target.value }))} />
              <Button size="sm" variant="secondary" onClick={applyTimeToAll} disabled={!bulkTime.startTime && !bulkTime.endTime}>Apply</Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/45">
                    {['Subject', 'Date', 'Start', 'End', 'Max marks', 'Room', 'Invigilator', ''].map((h) => <th key={h} className="px-3 py-2.5 font-semibold whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const err = rowErrors[r.key]
                    return (
                      <FragmentRow key={r.key} error={err}>
                        <td className="px-3 py-2 font-semibold text-ink whitespace-nowrap">{r.subjectName}</td>
                        <td className="px-3 py-2"><input type="date" aria-label={`Date for ${r.subjectName}`} className={`${cell} w-40`} value={r.date} min={range.min} max={range.max} onChange={(e) => patchRow(r.key, { date: e.target.value })} /></td>
                        <td className="px-3 py-2"><input type="time" aria-label={`Start time for ${r.subjectName}`} className={`${cell} w-28`} value={r.startTime} onChange={(e) => patchRow(r.key, { startTime: e.target.value })} /></td>
                        <td className="px-3 py-2"><input type="time" aria-label={`End time for ${r.subjectName}`} className={`${cell} w-28`} value={r.endTime} onChange={(e) => patchRow(r.key, { endTime: e.target.value })} /></td>
                        <td className="px-3 py-2"><input type="number" min="1" step="any" aria-label={`Max marks for ${r.subjectName}`} className={`${cell} w-24`} value={r.maxMarks} onChange={(e) => patchRow(r.key, { maxMarks: e.target.value })} /></td>
                        <td className="px-3 py-2"><input aria-label={`Room for ${r.subjectName}`} className={`${cell} w-28`} value={r.roomNo} maxLength={50} placeholder="Optional" onChange={(e) => patchRow(r.key, { roomNo: e.target.value })} /></td>
                        <td className="px-3 py-2 min-w-[200px]"><TeacherSelect compact value={r.invigilator} onChange={(t) => patchRow(r.key, { invigilator: t })} placeholder="Optional" /></td>
                        <td className="px-3 py-2"><IconButton icon={X} label={`Skip ${r.subjectName}`} onClick={() => removeRow(r.key)} /></td>
                      </FragmentRow>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {skipped > 0 && <p className="text-xs text-ink/50">{skipped} subject{skipped === 1 ? ' is' : 's are'} already scheduled for this class and not listed.</p>}
          </>
        )}

        <Alert>{serverError}</Alert>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={submitting} disabled={rows.length === 0}>Save all ({rows.length})</Button>
        </div>
      </div>
    </Modal>
  )
}

/** A table row followed (when `error` is set) by a highlighted message row. */
function FragmentRow({ error, children }) {
  return (
    <>
      <tr className={`border-b border-line last:border-0 ${error ? 'bg-coral/5' : ''}`}>{children}</tr>
      {error && (
        <tr className="bg-coral/5 border-b border-line">
          <td colSpan={8} className="px-3 pb-2 text-xs font-medium text-coral">{error}</td>
        </tr>
      )}
    </>
  )
}
