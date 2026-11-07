import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Trash2, ClipboardList } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import {
  AsyncContent, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton,
  Table, THead, Th, Tr, Td, selectClass,
} from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { formatDate } from '../../../utils/format.js'
import { useClasses } from '../classes/useClasses.js'
import { teachersApi } from '../teachers/teachers.api.js'
import { plansApi } from './syllabus.api.js'
import { currentSessionYear, sessionYearLabel, PLAN_STATUS_OPTIONS, STATUS_TONE, STATUS_LABEL } from './syllabus.constants.js'

const PAGE_SIZE = 20

export default function PlansListPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { classes, sectionsOf } = useClasses()

  const [sessionYear, setSessionYear] = useState(String(currentSessionYear()))
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: allTeachers } = useFetch(() => teachersApi.listAll(), [], { errorMessage: 'Could not load teachers.' })
  const teachers = allTeachers ?? []

  const subjects = classes.find((c) => c.id === classId)?.subjects ?? []
  const sections = sectionsOf(classId)

  const { data, loading, error, reload } = useFetch(
    () =>
      plansApi.list({
        sessionYear: sessionYear ? Number(sessionYear) : undefined,
        classId: classId || undefined,
        sectionId: sectionId || undefined,
        subjectId: subjectId || undefined,
        teacherId: teacherId || undefined,
        status: status || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [sessionYear, classId, sectionId, subjectId, teacherId, status, page],
    { errorMessage: 'Could not load syllabus plans.' }
  )

  const plans = data?.items ?? []

  const withPageReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const handleClassChange = (value) => {
    setClassId(value)
    setSectionId('')
    setSubjectId('')
    setPage(1)
  }

  const handleDelete = async (plan) => {
    try {
      await plansApi.remove(plan.id)
      notify('Plan deleted.', 'success')
      if (plans.length === 1 && page > 1) setPage(page - 1)
      else reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete plan.'), 'error')
    }
  }

  return (
    <AppShell
      title="Syllabus Plans"
      subtitle={data ? `${data.total} plan${data.total === 1 ? '' : 's'}` : 'Manage syllabus plans'}
      actions={
        <Button icon={Plus} onClick={() => navigate('/syllabus/plans/create')}>
          <span className="hidden sm:inline">Create plan</span>
          <span className="sm:hidden">New</span>
        </Button>
      }
    >
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="number"
          className={`${selectClass} w-28`}
          value={sessionYear}
          onChange={(e) => withPageReset(setSessionYear)(e.target.value)}
          placeholder="Year"
          aria-label="Session year"
        />
        <select className={`${selectClass} sm:w-44`} value={classId} onChange={(e) => handleClassChange(e.target.value)} aria-label="Class">
          <option value="">All classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {classId && (
          <select className={`${selectClass} sm:w-40`} value={sectionId} onChange={(e) => withPageReset(setSectionId)(e.target.value)} aria-label="Section">
            <option value="">All sections</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {classId && (
          <select className={`${selectClass} sm:w-44`} value={subjectId} onChange={(e) => withPageReset(setSubjectId)(e.target.value)} aria-label="Subject">
            <option value="">All subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select className={`${selectClass} sm:w-44`} value={teacherId} onChange={(e) => withPageReset(setTeacherId)(e.target.value)} aria-label="Teacher">
          <option value="">All teachers</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className={`${selectClass} sm:w-40`} value={status} onChange={(e) => withPageReset(setStatus)(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {PLAN_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading}
          error={error}
          empty={plans.length === 0}
          emptyState={
            <EmptyState
              icon={ClipboardList}
              title="No plans found"
              message="Create a syllabus plan to assign chapters to a class and track progress."
              action={<Button icon={Plus} onClick={() => navigate('/syllabus/plans/create')}>Create plan</Button>}
            />
          }
        >
          <Table>
            <THead>
              <Th>Class / Section</Th>
              <Th>Subject</Th>
              <Th>Teacher</Th>
              <Th>Status</Th>
              <Th>Chapters</Th>
              <Th>Year</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {plans.map((p) => (
                <Tr key={p.id} className="hover:bg-line/20">
                  <Td>
                    <span className="font-semibold text-ink">{p.class?.name}</span>
                    {p.section && <span className="text-ink/50"> — {p.section.name}</span>}
                  </Td>
                  <Td>{p.subject?.name ?? '—'}</Td>
                  <Td>{p.teacher?.name ?? '—'}</Td>
                  <Td><Badge tone={STATUS_TONE[p.status] ?? 'neutral'}>{STATUS_LABEL[p.status] ?? p.status}</Badge></Td>
                  <Td>{p.chapterCount}</Td>
                  <Td className="whitespace-nowrap">{sessionYearLabel(p.sessionYear)}</Td>
                  <Td className="whitespace-nowrap">{formatDate(p.createdAt)}</Td>
                  <Td className="text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <IconButton icon={Eye} label="View plan" tone="primary" onClick={() => navigate(`/syllabus/plans/${p.id}`)} />
                      <IconButton icon={Trash2} label="Delete plan" tone="danger" onClick={() => setDeleteTarget(p)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {!loading && !error && plans.length > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget)}
        title="Delete this syllabus plan?"
        message="This will permanently delete the plan and all its chapter assignments, progress history, and approvals. This cannot be undone."
        confirmLabel="Delete"
      />
    </AppShell>
  )
}
