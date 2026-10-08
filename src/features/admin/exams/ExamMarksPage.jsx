import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Check, Eraser, Loader2, Save, Users } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import { Alert, AsyncContent, Button, Card, ConfirmDialog, EmptyState, IconButton, SearchInput, Table, THead, Th, Tr, Td, inputClass, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'
import { RESULT_STATUSES } from '../constants.js'
import { examsApi } from './exams.api.js'
import { validateResultDraft } from './exams.validation.js'
import GradingProgress from './components/GradingProgress.jsx'

const PAGE_SIZE = 50
const cellInput = `${inputClass} !py-1.5 !px-2.5`

const originalValues = (result) => ({
  marks: result?.marksObtained != null ? String(result.marksObtained) : '',
  grade: result?.grade ?? '',
  remarks: result?.remarks ?? '',
  status: result?.status ?? 'PENDING',
})

function changedFields(values, result) {
  const before = originalValues(result)
  const changed = {}
  if (values.marks.trim() !== before.marks) changed.marksObtained = values.marks.trim() === '' ? null : Number(values.marks)
  if (values.grade.trim() !== before.grade.trim()) changed.grade = values.grade.trim() || null
  if (values.remarks.trim() !== before.remarks.trim()) changed.remarks = values.remarks.trim() || null
  if (values.status !== before.status) changed.status = values.status
  return changed
}

const isDirty = (entry) => Object.keys(changedFields(entry.values, entry.row.result)).length > 0

function RowIndicator({ state, dirty }) {
  if (state?.state === 'saving') return <span className="inline-flex items-center gap-1 text-xs text-ink/50"><Loader2 size={13} className="animate-spin" /> Saving</span>
  if (state?.state === 'error') return <span className="inline-flex items-start gap-1 text-xs text-coral font-medium max-w-[180px] whitespace-normal text-left"><AlertCircle size={13} className="shrink-0 mt-0.5" /> {state.message}</span>
  if (dirty) return <span className="text-xs text-chalk-ink font-semibold">Unsaved</span>
  if (state?.state === 'saved') return <span className="inline-flex items-center gap-1 text-xs text-success font-semibold"><Check size={13} /> Saved</span>
  return null
}

export default function ExamMarksPage() {
  const { examId, classId } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  const { data: exam } = useFetch(() => examsApi.get(examId), [examId], { errorMessage: 'Could not load the exam.' })
  const { data: progressList, reload: reloadProgress } = useFetch(() => examsApi.listClasses(examId), [examId], {
    errorMessage: 'Could not load grading progress.',
  })
  const { data: roster, setData: setRoster, loading, error } = useFetch(
    () => examsApi.classStudents(examId, classId, { page, pageSize: PAGE_SIZE, search: debouncedSearch }),
    [examId, classId, page, debouncedSearch],
    { errorMessage: 'Could not load students.' }
  )

  // Drafts are keyed by studentId and keep the row they were based on, so edits survive paging/searching.
  const [drafts, setDrafts] = useState({})
  const [rowStates, setRowStates] = useState({})
  const [savingAll, setSavingAll] = useState(false)
  const [clearing, setClearing] = useState(null)

  const progress = progressList?.find((c) => c.classId === classId)
  const examClass = exam?.classes?.find((c) => c.classId === classId)
  const className = progress?.className || examClass?.className || 'Class'
  const maxMarks = roster?.maxMarks ?? progress?.maxMarks ?? examClass?.maxMarks

  const dirtyEntries = Object.entries(drafts).filter(([, entry]) => isDirty(entry))

  const setRowState = (studentId, state) => setRowStates((s) => ({ ...s, [studentId]: state }))

  const updateDraft = (row, patch) => {
    setDrafts((d) => {
      const current = d[row.studentId] ?? { values: originalValues(row.result), row }
      return { ...d, [row.studentId]: { ...current, values: { ...current.values, ...patch } } }
    })
    setRowStates((s) => (s[row.studentId]?.state === 'saved' ? { ...s, [row.studentId]: undefined } : s))
  }

  const onMarksChange = (row, value, currentStatus) => {
    const patch = { marks: value }
    if (value !== '' && currentStatus !== 'GRADED') patch.status = 'GRADED'
    updateDraft(row, patch)
  }

  const onStatusChange = (row, status) => updateDraft(row, status === 'ABSENT' ? { status, marks: '' } : { status })

  const applySavedResult = (studentId, result) => {
    setRoster((r) => r && { ...r, items: r.items.map((it) => (it.studentId === studentId ? { ...it, result } : it)) })
  }

  /** Saves one draft entry. Returns true on success. */
  const saveEntry = async (studentId, entry) => {
    const { values, row } = entry
    const validationError = validateResultDraft(values, maxMarks)
    if (validationError) {
      setRowState(studentId, { state: 'error', message: validationError })
      return false
    }

    const changed = changedFields(values, row.result)
    if (Object.keys(changed).length === 0) return true

    setRowState(studentId, { state: 'saving' })
    try {
      let saved
      if (!row.result) {
        const body = { studentId, status: values.status }
        if (changed.marksObtained != null) body.marksObtained = changed.marksObtained
        if (changed.grade) body.grade = changed.grade
        if (changed.remarks) body.remarks = changed.remarks
        saved = await examsApi.createResult(examId, body)
      } else {
        saved = await examsApi.updateResult(examId, row.result.id, changed)
      }

      const nextResult = {
        ...(row.result ?? {}),
        marksObtained: values.marks.trim() === '' ? null : Number(values.marks),
        grade: values.grade.trim() || null,
        remarks: values.remarks.trim() || null,
        status: values.status,
        ...(saved && typeof saved === 'object' && saved.id ? saved : {}),
      }
      applySavedResult(studentId, nextResult)
      setDrafts((d) => {
        if (!d[studentId]) return d
        const next = { ...d }
        // Keep edits typed while the save was in flight; rebase them on the saved result.
        if (d[studentId].values === values) delete next[studentId]
        else next[studentId] = { ...d[studentId], row: { ...d[studentId].row, result: nextResult } }
        return next
      })
      setRowState(studentId, { state: 'saved' })
      return true
    } catch (err) {
      const message =
        getErrorCode(err) === 'INVALID_MARKS'
          ? `Marks must be between 0 and ${maxMarks}.`
          : getErrorMessage(err, 'Could not save this row.')
      setRowState(studentId, { state: 'error', message })
      return false
    }
  }

  const saveRow = async (studentId) => {
    const entry = drafts[studentId]
    if (!entry) return
    const ok = await saveEntry(studentId, entry)
    if (ok) reloadProgress()
  }

  const saveAll = async () => {
    const entries = dirtyEntries
    if (entries.length === 0) return
    setSavingAll(true)
    let saved = 0
    for (const [studentId, entry] of entries) {
      // Sequential on purpose — keeps the server load and error reporting predictable.
      if (await saveEntry(studentId, entry)) saved += 1
    }
    setSavingAll(false)
    reloadProgress()
    const failed = entries.length - saved
    if (failed === 0) notify(`Saved ${saved} row${saved === 1 ? '' : 's'}.`, 'success')
    else notify(`Saved ${saved} of ${entries.length} rows. ${failed} failed — check the rows marked in red.`, 'error')
  }

  const confirmClear = async () => {
    const row = clearing
    try {
      await examsApi.removeResult(examId, row.result.id)
      applySavedResult(row.studentId, null)
      setDrafts((d) => {
        const next = { ...d }
        delete next[row.studentId]
        return next
      })
      setRowState(row.studentId, undefined)
      reloadProgress()
      notify(`Result cleared for ${row.name}.`, 'success')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not clear the result.'), 'error')
    }
  }

  const onSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

  const items = roster?.items ?? []

  return (
    <AppShell
      title={`Marks · ${className}`}
      subtitle={exam ? `${exam.title}${maxMarks != null ? ` · Max marks ${maxMarks}` : ''}` : undefined}
      onBack={() => navigate(`/exams/${examId}`)}
      actions={
        <Button icon={Save} onClick={saveAll} loading={savingAll} disabled={dirtyEntries.length === 0}>
          <span className="hidden sm:inline">Save all changed rows</span>
          {dirtyEntries.length > 0 && <span className="sm:ml-0.5">({dirtyEntries.length})</span>}
        </Button>
      }
    >
      <Card className="p-5 mb-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            {progress ? (
              <GradingProgress graded={progress.gradedCount} total={progress.studentCount} />
            ) : (
              <p className="text-sm text-ink/50">Loading progress…</p>
            )}
          </div>
          <p className="text-sm text-ink/60 md:pl-6 md:border-l md:border-line">
            {dirtyEntries.length > 0 ? (
              <span className="font-semibold text-chalk-ink">{dirtyEntries.length} unsaved row{dirtyEntries.length === 1 ? '' : 's'}</span>
            ) : (
              'All changes saved'
            )}
          </p>
        </div>
        <p className="text-xs text-ink/45 mt-3">
          Typing marks sets the status to Graded. Choosing Absent clears the marks. Press Enter in a row to save it.
        </p>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={onSearch} placeholder="Search by name, admission or roll no…" />
      </div>

      <Card>
        <AsyncContent
          loading={loading && !roster}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={Users}
              title={debouncedSearch ? 'No matching students' : 'No students in this class'}
              message={debouncedSearch ? 'Try a different search term.' : 'Students enrolled in this class will appear here.'}
            />
          }
        >
          <Table className={loading ? 'opacity-60' : ''}>
            <THead>
              <Th>Roll</Th>
              <Th>Student</Th>
              <Th>Marks{maxMarks != null ? ` / ${maxMarks}` : ''}</Th>
              <Th>Grade</Th>
              <Th>Remarks</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {items.map((row) => {
                const entry = drafts[row.studentId]
                const values = entry?.values ?? originalValues(row.result)
                const dirty = !!entry && isDirty(entry)
                const state = rowStates[row.studentId]
                const busy = state?.state === 'saving'
                const onKeyDown = (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (dirty && !busy) saveRow(row.studentId)
                  }
                }
                return (
                  <Tr key={row.studentId} className={dirty ? 'bg-chalk/10' : state?.state === 'error' ? 'bg-coral/5' : ''}>
                    <Td className="whitespace-nowrap">{row.rollNo ?? '—'}</Td>
                    <Td className="min-w-[160px]">
                      <p className="font-semibold text-ink">{row.name}</p>
                      {row.admissionNo && <p className="text-xs text-ink/45">{row.admissionNo}</p>}
                    </Td>
                    <Td>
                      <input
                        type="number"
                        min="0"
                        max={maxMarks ?? undefined}
                        step="any"
                        inputMode="decimal"
                        aria-label={`Marks for ${row.name}`}
                        className={`${cellInput} w-24`}
                        value={values.marks}
                        disabled={busy || values.status === 'ABSENT'}
                        placeholder={values.status === 'ABSENT' ? '—' : ''}
                        onChange={(e) => onMarksChange(row, e.target.value, values.status)}
                        onKeyDown={onKeyDown}
                      />
                    </Td>
                    <Td>
                      <input
                        aria-label={`Grade for ${row.name}`}
                        className={`${cellInput} w-20`}
                        value={values.grade}
                        maxLength={10}
                        disabled={busy}
                        placeholder="A+"
                        onChange={(e) => updateDraft(row, { grade: e.target.value })}
                        onKeyDown={onKeyDown}
                      />
                    </Td>
                    <Td>
                      <input
                        aria-label={`Remarks for ${row.name}`}
                        className={`${cellInput} min-w-[160px]`}
                        value={values.remarks}
                        disabled={busy}
                        placeholder="Optional"
                        onChange={(e) => updateDraft(row, { remarks: e.target.value })}
                        onKeyDown={onKeyDown}
                      />
                    </Td>
                    <Td>
                      <select
                        aria-label={`Status for ${row.name}`}
                        className={`${selectClass} !py-1.5 !px-2.5 w-28`}
                        value={values.status}
                        disabled={busy}
                        onChange={(e) => onStatusChange(row, e.target.value)}
                      >
                        {RESULT_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <RowIndicator state={state} dirty={dirty} />
                        <Button size="sm" variant={dirty ? 'primary' : 'secondary'} disabled={!dirty || busy || savingAll} onClick={() => saveRow(row.studentId)}>
                          Save
                        </Button>
                        {row.result && (
                          <IconButton icon={Eraser} label={`Clear result for ${row.name}`} tone="danger" disabled={busy || savingAll} onClick={() => setClearing(row)} />
                        )}
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {roster && <Pagination page={roster.page} totalPages={roster.totalPages} total={roster.total} onChange={setPage} />}

      {dirtyEntries.some(([id]) => !items.some((it) => it.studentId === id)) && (
        <Alert tone="warning" className="mt-4">
          Some unsaved changes are on other pages or hidden by your search. “Save all changed rows” saves them too.
        </Alert>
      )}

      <ConfirmDialog
        open={!!clearing}
        onClose={() => setClearing(null)}
        onConfirm={confirmClear}
        title="Clear result?"
        confirmLabel="Clear result"
        message={
          clearing && (
            <>
              The recorded marks, grade, remarks and status for <span className="font-semibold text-ink">{clearing.name}</span> will be
              permanently deleted. The student will show as not graded.
            </>
          )
        }
      />
    </AppShell>
  )
}
