import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CalendarDays, Layers, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, AsyncContent, Button, Card, ConfirmDialog, EmptyState, IconButton, PageLoader, Tabs, Table, THead, Th, Tr, Td } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'
import { formatDateTime, formatNumber } from '../../../utils/format.js'
import { useClasses } from '../classes/useClasses.js'
import { examsApi } from './exams.api.js'
import ExamFormModal from './components/ExamFormModal.jsx'
import AddExamClassModal from './components/AddExamClassModal.jsx'
import { ExamDeleteMessage } from './components/ExamDeleteMessage.jsx'
import { examDates } from './components/examFormat.js'
import GradingProgress from './components/GradingProgress.jsx'
import DateSheetTab from './components/DateSheetTab.jsx'
import MarksTab from './components/MarksTab.jsx'

const TABS = ['overview', 'datesheet', 'marks']

function InfoItem({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-board/10 text-board flex items-center justify-center shrink-0">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink/45">{label}</p>
        <p className="text-sm font-semibold text-ink break-words">{children}</p>
      </div>
    </div>
  )
}

export default function ExamDetailPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { classes } = useClasses()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab = TABS.includes(tabParam) ? tabParam : 'overview'
  const openPaperId = searchParams.get('paper')
  const setTab = (value) => setSearchParams(value === 'overview' ? {} : { tab: value }, { replace: true })
  const openPaper = (id) => setSearchParams(id ? { tab: 'marks', paper: id } : { tab: 'marks' }, { replace: true })

  const { data: exam, loading, error, reload: reloadExam } = useFetch(() => examsApi.get(examId), [examId], {
    errorMessage: 'Could not load the exam.',
  })
  const {
    data: examClasses,
    loading: classesLoading,
    error: classesError,
    reload: reloadClasses,
  } = useFetch(() => examsApi.listClasses(examId), [examId], { errorMessage: 'Could not load the exam’s classes.' })

  const {
    data: schedule,
    loading: scheduleLoading,
    error: scheduleError,
    reload: reloadSchedule,
  } = useFetch(() => examsApi.listSchedule(examId), [examId], { errorMessage: 'Could not load the date sheet.' })
  const papers = schedule?.items ?? []

  const [editOpen, setEditOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [removing, setRemoving] = useState(null)

  const rows = examClasses ?? []
  const assignedIds = new Set(rows.map((c) => c.classId))
  const availableClasses = classes.filter((c) => !assignedIds.has(c.id))

  const reloadAll = () => {
    reloadExam()
    reloadClasses()
    reloadSchedule()
  }

  const confirmDeleteExam = async () => {
    try {
      await examsApi.remove(examId)
      notify('Exam deleted.', 'success')
      navigate('/exams', { replace: true })
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete the exam.'), 'error')
    }
  }

  const confirmRemoveClass = async () => {
    try {
      await examsApi.removeClass(examId, removing.classId)
      notify(`${removing.className} removed from this exam.`, 'success')
      reloadAll()
    } catch (err) {
      if (getErrorCode(err) === 'EXAM_CLASS_HAS_SCHEDULE') {
        notify(`${removing.className} still has papers on the date sheet. Delete those papers first, then remove the class.`, 'error')
      } else {
        notify(getErrorMessage(err, 'Could not remove the class.'), 'error')
      }
    }
  }

  if (loading && !exam) {
    return (
      <AppShell title="Exam" onBack={() => navigate('/exams')}>
        <PageLoader className="py-24" />
      </AppShell>
    )
  }

  if (error || !exam) {
    return (
      <AppShell title="Exam" onBack={() => navigate('/exams')}>
        <Alert>{error || 'Exam not found.'}</Alert>
      </AppShell>
    )
  }

  return (
    <AppShell
      title={exam.title}
      subtitle={examDates(exam)}
      onBack={() => navigate('/exams')}
      actions={
        <>
          <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button variant="danger-ghost" icon={Trash2} onClick={() => setDeleteOpen(true)}>
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </>
      }
    >
      <Tabs
        className="mb-5 max-w-full overflow-x-auto"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'overview', label: 'Overview & Classes' },
          { value: 'datesheet', label: 'Date Sheet', count: schedule ? papers.length : undefined },
          { value: 'marks', label: 'Marks' },
        ]}
      />

      {tab === 'overview' && (
        <>
      <Card className="p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <InfoItem icon={CalendarDays} label="Dates">{examDates(exam)}</InfoItem>
          <InfoItem icon={Layers} label="Classes">{formatNumber(rows.length || exam.classes?.length)}</InfoItem>
          <InfoItem icon={UserRound} label="Created by">{exam.createdBy?.name || '—'}</InfoItem>
        </div>
        {exam.description && (
          <p className="mt-5 pt-5 border-t border-line text-sm text-ink/70 whitespace-pre-line">{exam.description}</p>
        )}
        <p className="mt-4 text-xs text-ink/40">
          Created {formatDateTime(exam.createdAt)} · Last updated {formatDateTime(exam.updatedAt)}
        </p>
      </Card>

      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">Classes</h2>
        <Button variant="secondary" size="sm" icon={Plus} onClick={() => setAddOpen(true)} disabled={!examClasses || availableClasses.length === 0}>
          Add class
        </Button>
      </div>

      <Card>
        <AsyncContent
          loading={classesLoading && !examClasses}
          error={classesError}
          empty={rows.length === 0}
          emptyState={
            <EmptyState
              icon={Layers}
              title="No classes assigned"
              message="Add a class to this exam, then build its date sheet."
              action={availableClasses.length > 0 && <Button icon={Plus} onClick={() => setAddOpen(true)}>Add class</Button>}
            />
          }
        >
          <Table>
            <THead>
              <Th>Class</Th>
              <Th>Max marks</Th>
              <Th>Grading progress</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {rows.map((c) => (
                <Tr key={c.classId}>
                  <Td className="font-semibold text-ink whitespace-nowrap">{c.className}</Td>
                  <Td>{c.maxMarks}</Td>
                  <Td className="min-w-[200px]">
                    <GradingProgress graded={c.gradedCount} total={c.studentCount} />
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <IconButton icon={X} label={`Remove ${c.className} from exam`} onClick={() => setRemoving(c)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>
        </>
      )}

      {tab === 'datesheet' && (
        <DateSheetTab
          examId={examId}
          exam={exam}
          examClasses={rows}
          classes={classes}
          papers={papers}
          loading={scheduleLoading}
          error={scheduleError}
          reload={reloadAll}
        />
      )}

      {tab === 'marks' && (
        <MarksTab
          examId={examId}
          examClasses={rows}
          classes={classes}
          papers={papers}
          loading={scheduleLoading}
          error={scheduleError}
          reload={reloadAll}
          openPaperId={openPaperId}
          onOpenPaper={openPaper}
        />
      )}

      <ExamFormModal open={editOpen} onClose={() => setEditOpen(false)} exam={exam} classes={classes} onSaved={() => {
        notify('Exam updated.', 'success')
        reloadExam()
      }} />

      <AddExamClassModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        examId={examId}
        availableClasses={availableClasses}
        onSaved={(cls) => {
          notify(`${cls?.name ?? 'Class'} added to this exam.`, 'success')
          reloadAll()
        }}
      />

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemoveClass}
        danger={false}
        confirmLabel="Remove class"
        title="Remove class from exam?"
        message={
          removing && (
            <>
              <span className="font-semibold text-ink">{removing.className}</span> will no longer take this exam. A class
              that still has papers on the date sheet can't be removed — delete those papers first.
            </>
          )
        }
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDeleteExam}
        title="Delete exam permanently?"
        confirmLabel="Delete permanently"
        message={<ExamDeleteMessage title={exam.title} />}
      />
    </AppShell>
  )
}
