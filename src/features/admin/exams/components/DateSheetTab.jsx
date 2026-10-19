import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, ListPlus, Lock, Pencil, Plus, Trash2, CalendarDays, UserSearch } from 'lucide-react'
import { AsyncContent, Button, Card, ConfirmDialog, EmptyState, IconButton, Tabs, Table, THead, Th, Tr, Td } from '../../../../components/ui.jsx'
import { useToast } from '../../../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../../../api/httpClient.js'
import { examsApi } from '../exams.api.js'
import PaperFormModal from './PaperFormModal.jsx'
import BulkDateSheetModal from './BulkDateSheetModal.jsx'
import { byDateTime, formatPaperDate, formatPaperTime } from './scheduleUtils.js'

const RULES = [
  'A class can’t have two papers at the same time, even across different exams.',
  'A teacher can’t invigilate two papers at once, or on a day of approved leave.',
  'A room hosts one paper at a time. Back-to-back papers are fine.',
  'Each subject gets one paper per class in an exam.',
]

function ClassChips({ examClasses, value, onChange }) {
  const options = [{ value: '', label: 'All classes' }, ...examClasses.map((c) => ({ value: c.classId, label: c.className }))]
  return <Tabs options={options} value={value} onChange={onChange} className="max-w-full overflow-x-auto" />
}

function PaperActions({ paper, onEdit, onDelete }) {
  const hasMarks = (paper.markedCount ?? 0) > 0
  return (
    <div className="inline-flex items-center gap-1">
      <Link
        to={`/teacher-availability?date=${paper.date}&start=${paper.startTime}&end=${paper.endTime}`}
        title="Find a free teacher for this paper's slot"
        aria-label="Find invigilator"
        className="rounded-lg p-1.5 text-ink/40 hover:text-board hover:bg-board/10 transition-colors"
      >
        <UserSearch size={15} />
      </Link>
      <IconButton icon={Pencil} label={`Edit ${paper.className} ${paper.subjectName} paper`} tone="primary" onClick={() => onEdit(paper)} />
      {hasMarks ? (
        <IconButton icon={Lock} label="Marks recorded — this paper can't be deleted" disabled className="opacity-50 cursor-not-allowed" />
      ) : (
        <IconButton icon={Trash2} label={`Delete ${paper.className} ${paper.subjectName} paper`} tone="danger" onClick={() => onDelete(paper)} />
      )}
    </div>
  )
}

export default function DateSheetTab({ examId, exam, examClasses, classes, papers, loading, error, reload }) {
  const { notify } = useToast()
  const [classId, setClassId] = useState('')
  const [view, setView] = useState('date')
  const [form, setForm] = useState({ open: false, paper: null })
  const [bulkOpen, setBulkOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const visible = papers.filter((p) => !classId || p.classId === classId).sort(byDateTime)
  const noClasses = examClasses.length === 0

  const confirmDelete = async () => {
    try {
      await examsApi.removePaper(examId, deleting.id)
      notify('Paper deleted.', 'success')
      reload()
    } catch (err) {
      const code = getErrorCode(err)
      notify(
        code === 'EXAM_SCHEDULE_HAS_MARKS'
          ? 'Marks are already recorded for this paper, so it can’t be deleted.'
          : getErrorMessage(err, 'Could not delete the paper.'),
        'error'
      )
      if (code === 'EXAM_SCHEDULE_HAS_MARKS' || code === 'EXAM_SCHEDULE_NOT_FOUND') reload()
    }
  }

  const openEdit = (paper) => setForm({ open: true, paper })
  const editById = (id) => {
    const p = papers.find((x) => x.id === id)
    if (p) openEdit(p)
  }

  const byDate = []
  visible.forEach((p) => {
    const last = byDate[byDate.length - 1]
    if (last?.date === p.date) last.items.push(p)
    else byDate.push({ date: p.date, items: [p] })
  })
  const byClass = examClasses
    .filter((c) => !classId || c.classId === classId)
    .map((c) => ({ ...c, items: visible.filter((p) => p.classId === c.classId) }))
    .filter((c) => c.items.length > 0)

  const invigilator = (p) => p.invigilator?.name || <span className="text-ink/35">—</span>
  const room = (p) => p.roomNo || <span className="text-ink/35">—</span>

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <Tabs options={[{ value: 'date', label: 'By date' }, { value: 'class', label: 'By class' }]} value={view} onChange={setView} />
          <ClassChips examClasses={examClasses} value={classId} onChange={setClassId} />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" icon={ListPlus} disabled={noClasses} onClick={() => setBulkOpen(true)}>Create for a class</Button>
          <Button size="sm" icon={Plus} disabled={noClasses} onClick={() => setForm({ open: true, paper: null })}>Add paper</Button>
        </div>
      </div>

      {noClasses && <p className="text-sm text-ink/55 mb-4">Assign a class to this exam on the Overview tab before building the date sheet.</p>}

      <Card>
        <AsyncContent
          loading={loading && papers.length === 0}
          error={error}
          empty={visible.length === 0}
          emptyState={
            <EmptyState
              icon={CalendarDays}
              title={classId ? 'No papers for this class' : 'No papers scheduled'}
              message="Add papers one by one, or create a whole class’s date sheet at once."
              action={!noClasses && <Button icon={CalendarPlus} onClick={() => setBulkOpen(true)}>Create for a class</Button>}
            />
          }
        >
          {view === 'date' ? (
            <Table>
              <THead>
                <Th>Time</Th><Th>Class</Th><Th>Subject</Th><Th>Max marks</Th><Th>Room</Th><Th>Invigilator</Th><Th>Marked</Th><Th className="text-right">Actions</Th>
              </THead>
              <tbody>
                {byDate.map((g) => (
                  <Fragment key={g.date}>
                    <tr className="bg-line/30 border-b border-line">
                      <td colSpan={8} className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ink/60">{formatPaperDate(g.date, { weekday: true })}</td>
                    </tr>
                    {g.items.map((p) => (
                      <Tr key={p.id}>
                        <Td className="whitespace-nowrap">{formatPaperTime(p)}</Td>
                        <Td className="font-semibold text-ink whitespace-nowrap">{p.className}</Td>
                        <Td className="whitespace-nowrap">{p.subjectName}</Td>
                        <Td>{p.maxMarks}</Td>
                        <Td className="whitespace-nowrap">{room(p)}</Td>
                        <Td className="whitespace-nowrap">{invigilator(p)}</Td>
                        <Td>{p.markedCount ?? 0}</Td>
                        <Td className="text-right whitespace-nowrap"><PaperActions paper={p} onEdit={openEdit} onDelete={setDeleting} /></Td>
                      </Tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="divide-y divide-line">
              {byClass.map((c) => (
                <div key={c.classId}>
                  <h3 className="px-5 pt-4 pb-1 font-display text-base font-semibold text-ink">{c.className}</h3>
                  <Table>
                    <THead>
                      <Th>Date</Th><Th>Time</Th><Th>Subject</Th><Th>Max marks</Th><Th>Room</Th><Th>Invigilator</Th><Th className="text-right">Actions</Th>
                    </THead>
                    <tbody>
                      {c.items.map((p) => (
                        <Tr key={p.id}>
                          <Td className="whitespace-nowrap font-medium text-ink">{formatPaperDate(p.date, { weekday: true })}</Td>
                          <Td className="whitespace-nowrap">{formatPaperTime(p)}</Td>
                          <Td className="whitespace-nowrap">{p.subjectName}</Td>
                          <Td>{p.maxMarks}</Td>
                          <Td className="whitespace-nowrap">{room(p)}</Td>
                          <Td className="whitespace-nowrap">{invigilator(p)}</Td>
                          <Td className="text-right whitespace-nowrap"><PaperActions paper={p} onEdit={openEdit} onDelete={setDeleting} /></Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </AsyncContent>
      </Card>

      <ul className="mt-4 text-xs text-ink/50 space-y-0.5 list-disc pl-5">
        {RULES.map((r) => <li key={r}>{r}</li>)}
      </ul>

      <PaperFormModal
        open={form.open}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
        examId={examId}
        exam={exam}
        examClasses={examClasses}
        classes={classes}
        papers={papers}
        paper={form.paper}
        onEditExisting={editById}
        onStale={reload}
        onSaved={(_, { isEdit }) => {
          notify(isEdit ? 'Paper updated.' : 'Paper added.', 'success')
          reload()
        }}
      />

      <BulkDateSheetModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        examId={examId}
        exam={exam}
        examClasses={examClasses}
        classes={classes}
        papers={papers}
        initialClassId={classId}
        onSaved={(count) => {
          notify(`${count} paper${count === 1 ? '' : 's'} added to the date sheet.`, 'success')
          reload()
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this paper?"
        confirmLabel="Delete paper"
        message={deleting && <><span className="font-semibold text-ink">{deleting.className} · {deleting.subjectName}</span> on {formatPaperDate(deleting.date)} will be removed from the date sheet.</>}
      />
    </>
  )
}
