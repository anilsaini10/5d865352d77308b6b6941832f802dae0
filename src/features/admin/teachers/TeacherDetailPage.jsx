import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2, RotateCcw } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, Button, PageLoader, Tabs } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { useClasses } from '../classes/useClasses.js'
import { teachersApi } from './teachers.api.js'
import TeacherFormModal from './components/TeacherFormModal.jsx'
import TeacherProfileTab from './components/TeacherProfileTab.jsx'
import TeacherSubjectsTab from './components/TeacherSubjectsTab.jsx'
import TeacherTimetableTab from './components/TeacherTimetableTab.jsx'
import { DeleteTeacherDialog } from './components/TeacherDialogs.jsx'
import { useSubjects } from './components/useSubjects.js'

const TABS = [
  { value: 'profile', label: 'Profile' },
  { value: 'subjects', label: 'Subjects' },
  { value: 'timetable', label: 'Timetable' },
]

export default function TeacherDetailPage() {
  const { teacherId } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { classes, reload: reloadClasses } = useClasses()
  const { names: subjectNames } = useSubjects()

  const [tab, setTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const { data: teacher, loading, error, reload } = useFetch(() => teachersApi.get(teacherId), [teacherId], {
    errorMessage: 'Could not load teacher.',
  })

  const active = teacher?.status !== 'INACTIVE'

  const confirmDelete = async () => {
    try {
      await teachersApi.remove(teacher.id)
      notify(`${teacher.name} was deleted and signed out.`, 'success')
      reload()
      reloadClasses()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete teacher.'), 'error')
    }
  }

  const restore = async () => {
    setRestoring(true)
    try {
      await teachersApi.restore(teacher.id)
      notify(`${teacher.name} was restored — their login is enabled again.`, 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not restore teacher.'), 'error')
    } finally {
      setRestoring(false)
    }
  }

  const actions = teacher && (
    <>
      <Button variant="secondary" icon={Pencil} aria-label="Edit teacher" onClick={() => setEditing(true)}>
        <span className="hidden sm:inline">Edit</span>
      </Button>
      {active ? (
        <Button variant="danger-ghost" icon={Trash2} aria-label="Delete teacher" onClick={() => setDeleting(true)}>
          <span className="hidden sm:inline">Delete</span>
        </Button>
      ) : (
        <Button variant="secondary" icon={RotateCcw} aria-label="Restore teacher" loading={restoring} onClick={restore}>
          <span className="hidden sm:inline">Restore</span>
        </Button>
      )}
    </>
  )

  return (
    <AppShell
      title={teacher?.name ?? 'Teacher'}
      subtitle={teacher ? [teacher.employeeId, teacher.email].filter(Boolean).join(' · ') : undefined}
      onBack={() => navigate('/teachers')}
      actions={actions}
    >
      {loading && !teacher ? (
        <PageLoader className="py-24" />
      ) : error && !teacher ? (
        <Alert>{error}</Alert>
      ) : teacher ? (
        <>
          {!active && (
            <Alert tone="warning" className="mb-4">
              This teacher is deleted and can't log in. Restore them to re-enable their login.
            </Alert>
          )}
          <div className="overflow-x-auto mb-5">
            <Tabs options={TABS} value={tab} onChange={setTab} />
          </div>

          {tab === 'profile' && <TeacherProfileTab teacher={teacher} />}
          {tab === 'subjects' && (
            <TeacherSubjectsTab teacher={teacher} classes={classes} subjectNames={subjectNames} onChanged={reload} />
          )}
          {tab === 'timetable' && <TeacherTimetableTab teacherId={teacher.id} />}
        </>
      ) : null}

      <TeacherFormModal
        open={editing}
        onClose={() => setEditing(false)}
        teacher={teacher}
        classes={classes}
        subjectNames={subjectNames}
        onSaved={() => {
          notify(`${teacher.name} was updated.`, 'success')
          reload()
          reloadClasses()
        }}
      />

      <DeleteTeacherDialog teacher={deleting ? teacher : null} onClose={() => setDeleting(false)} onConfirm={confirmDelete} />
    </AppShell>
  )
}
