import { useState } from 'react'
import { Plus, GraduationCap, Eye, Pencil, Trash2, RotateCcw } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import {
  AsyncContent,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  RECORD_STATUS,
  SearchInput,
  StatusFilter,
  Table,
  THead,
  Th,
  Tr,
  Td,
  selectClass,
} from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage, getErrorCode } from '../../../api/httpClient.js'
import { useClasses } from '../classes/useClasses.js'
import { GENDERS, enumMeta } from '../constants.js'
import { studentsApi, parseSuggestedRollNo } from './students.api.js'
import StudentFormModal from './components/StudentFormModal.jsx'
import StudentDetailsModal from './components/StudentDetailsModal.jsx'
import StudentCreatedBanner from './components/StudentCreatedBanner.jsx'

const PAGE_SIZE = 15

export default function StudentsPage() {
  const { notify } = useToast()
  const { classes, sectionsOf, error: classesError } = useClasses()

  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [status, setStatus] = useState(RECORD_STATUS.ACTIVE)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  const [formModal, setFormModal] = useState(null) // { student?, restore? } — no student means "create"
  const [viewing, setViewing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [justCreated, setJustCreated] = useState(null)

  const { data, loading, error, reload } = useFetch(
    () =>
      studentsApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        classId,
        sectionId,
        // backend defaults to ACTIVE when status is omitted
        status: status === RECORD_STATUS.ACTIVE ? undefined : status,
      }),
    [page, debouncedSearch, classId, sectionId, status],
    { errorMessage: 'Could not load students.' }
  )

  const students = data?.items ?? []
  const hasFilters = !!(debouncedSearch || classId || sectionId)

  const withPageReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const changeClass = (value) => {
    setClassId(value)
    setSectionId('')
    setPage(1)
  }

  const handleSaved = (result, { isEdit, restored }) => {
    if (isEdit) {
      const name = result.student?.name ?? 'Student'
      notify(restored ? `${name} was restored.` : `${name} was updated.`, 'success')
    } else {
      setJustCreated(result)
    }
    reload()
  }

  // after a row leaves the current view, step back if the page would be empty
  const reloadAfterRemoval = () => {
    if (students.length === 1 && page > 1) setPage(page - 1)
    else reload()
  }

  const restoreStudent = async (student) => {
    try {
      await studentsApi.restore(student.id)
      notify(`${student.name} was restored.`, 'success')
      if (status === RECORD_STATUS.INACTIVE) reloadAfterRemoval()
      else reload()
    } catch (err) {
      const message = getErrorMessage(err, 'Could not restore student.')
      if (getErrorCode(err) === 'ROLL_NO_TAKEN') {
        notify('Roll number already taken — choose a new roll number to restore this student.', 'error')
        setFormModal({ student, restore: { message, suggestedRollNo: parseSuggestedRollNo(message) } })
      } else {
        notify(message, 'error')
      }
    }
  }

  const confirmDelete = async () => {
    const student = deleteTarget
    try {
      await studentsApi.remove(student.id)
      notify(`${student.name} was deleted. You can restore them from the Deleted view.`, 'success')
      if (status === RECORD_STATUS.ACTIVE) reloadAfterRemoval()
      else reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete student.'), 'error')
    }
  }

  const sections = classId ? sectionsOf(classId) : []

  const emptyState =
    status === RECORD_STATUS.INACTIVE && !hasFilters ? (
      <EmptyState icon={GraduationCap} title="No deleted students" message="Students you delete show up here and can be restored." />
    ) : hasFilters ? (
      <EmptyState icon={GraduationCap} title="No matches" message="Try a different search term or class filter." />
    ) : (
      <EmptyState
        icon={GraduationCap}
        title="No students yet"
        message="Add your first student — a parent login is set up at the same time."
        action={<Button icon={Plus} onClick={() => setFormModal({})}>Add student</Button>}
      />
    )

  return (
    <AppShell
      title="Students"
      subtitle="Admissions, class placement and parent contacts"
      actions={<Button icon={Plus} onClick={() => setFormModal({})}>Add student</Button>}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={withPageReset(setSearch)} placeholder="Search by name, admission no. or parent..." />
        <select className={`${selectClass} sm:w-44`} value={classId} onChange={(e) => changeClass(e.target.value)} aria-label="Filter by class">
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className={`${selectClass} sm:w-40`}
          value={sectionId}
          onChange={(e) => withPageReset(setSectionId)(e.target.value)}
          disabled={!classId}
          aria-label="Filter by section"
        >
          <option value="">{classId ? 'All sections' : 'Section'}</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-5 overflow-x-auto">
        <StatusFilter value={status} onChange={withPageReset(setStatus)} />
      </div>

      {classesError && <p className="text-xs text-coral mb-3">{classesError}</p>}

      {justCreated && (
        <StudentCreatedBanner
          student={justCreated.student}
          parentAccount={justCreated.parentAccount}
          onDismiss={() => setJustCreated(null)}
        />
      )}

      <Card className="overflow-hidden">
        <AsyncContent loading={loading} error={error} empty={students.length === 0} emptyState={emptyState}>
          <Table>
            <THead>
              <Th>Student</Th>
              <Th>Class</Th>
              <Th>Roll</Th>
              <Th>Parent</Th>
              <Th>Attendance</Th>
              {status !== RECORD_STATUS.ACTIVE && <Th>Status</Th>}
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {students.map((s) => {
                const inactive = s.status === 'INACTIVE'
                return (
                  <Tr key={s.id} className="hover:bg-line/20">
                    <Td>
                      <button onClick={() => setViewing(s)} className="text-left">
                        <span className="block font-semibold text-ink hover:text-board">{s.name}</span>
                        <span className="block text-xs text-ink/50">
                          {s.admissionNo} · {enumMeta(GENDERS, s.gender).label}
                        </span>
                      </button>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {s.className}
                      {s.sectionName ? ` – ${s.sectionName}` : ''}
                    </Td>
                    <Td>{s.rollNo ?? '—'}</Td>
                    <Td>
                      <span className="block text-ink/80">{s.parentName}</span>
                      <span className="block text-xs text-ink/50">{s.parentPhone}</span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {s.attendancePercentage == null ? '—' : `${Number(s.attendancePercentage).toFixed(1)}%`}
                    </Td>
                    {status !== RECORD_STATUS.ACTIVE && (
                      <Td>
                        <Badge tone={inactive ? 'inactive' : 'active'}>{inactive ? 'Deleted' : 'Active'}</Badge>
                      </Td>
                    )}
                    <Td className="text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <IconButton icon={Eye} label={`View ${s.name}`} onClick={() => setViewing(s)} />
                        <IconButton icon={Pencil} label={`Edit ${s.name}`} tone="primary" onClick={() => setFormModal({ student: s })} />
                        {inactive ? (
                          <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => restoreStudent(s)}>
                            Restore
                          </Button>
                        ) : (
                          <IconButton icon={Trash2} label={`Delete ${s.name}`} tone="danger" onClick={() => setDeleteTarget(s)} />
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

      {!loading && !error && students.length > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}

      <StudentFormModal
        open={!!formModal}
        onClose={() => setFormModal(null)}
        student={formModal?.student}
        restore={formModal?.restore}
        classes={classes}
        sectionsOf={sectionsOf}
        onSaved={handleSaved}
      />

      {viewing && (
        <StudentDetailsModal
          student={viewing}
          onClose={() => setViewing(null)}
          onEdit={(s) => {
            setViewing(null)
            setFormModal({ student: s })
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this student?"
        confirmLabel="Delete student"
        message={
          <>
            <p>
              <span className="font-semibold text-ink">{deleteTarget?.name}</span> will be moved to the Deleted view. This is not
              permanent — their records and history are kept and you can restore them any time.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Roll number {deleteTarget?.rollNo} is freed for other students, so restoring may need a new roll number.</li>
              <li>The parent's login is not affected.</li>
            </ul>
          </>
        }
      />
    </AppShell>
  )
}
