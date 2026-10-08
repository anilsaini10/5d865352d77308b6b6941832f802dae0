import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, UserSquare2, Pencil, Trash2, RotateCcw } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import {
  AsyncContent, Badge, Button, Card, CredentialsBanner, EmptyState, IconButton, SearchInput, StatusFilter,
  RECORD_STATUS, Table, THead, Th, Tr, Td, inputClass, selectClass,
} from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { experienceLabel } from '../../../utils/format.js'
import { DEFAULT_PASSWORD_HINT } from '../constants.js'
import { useClasses } from '../classes/useClasses.js'
import { teachersApi } from './teachers.api.js'
import TeacherFormModal from './components/TeacherFormModal.jsx'
import { DeleteTeacherDialog } from './components/TeacherDialogs.jsx'
import { useSubjects } from './components/useSubjects.js'

const PAGE_SIZE = 15

export default function TeachersPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { classes, reload: reloadClasses } = useClasses()
  const { names: subjectNames } = useSubjects()

  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('')
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState(RECORD_STATUS.ACTIVE)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())
  const debouncedSubject = useDebouncedValue(subject.trim())

  const [formModal, setFormModal] = useState(null) // { teacher? }
  const [justCreated, setJustCreated] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, debouncedSubject, classId, status])

  const { data, loading, error, reload } = useFetch(
    () => teachersApi.list({ page, pageSize: PAGE_SIZE, search: debouncedSearch, subject: debouncedSubject, classId, status }),
    [page, debouncedSearch, debouncedSubject, classId, status],
    { errorMessage: 'Could not load teachers.' }
  )
  const teachers = data?.items ?? []
  const hasFilters = !!(debouncedSearch || debouncedSubject || classId || status !== RECORD_STATUS.ACTIVE)

  const handleSaved = (result, { isEdit }) => {
    if (isEdit) notify(`${result.teacher?.name ?? 'Teacher'} was updated.`, 'success')
    else setJustCreated(result)
    reload()
    reloadClasses()
  }

  const confirmDelete = async () => {
    const t = deleteTarget
    try {
      await teachersApi.remove(t.id)
      notify(`${t.name} was deleted and signed out.`, 'success')
      reload()
      reloadClasses()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete teacher.'), 'error')
    }
  }

  const restore = async (t) => {
    try {
      await teachersApi.restore(t.id)
      notify(`${t.name} was restored — their login is enabled again.`, 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not restore teacher.'), 'error')
    }
  }

  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn()
  }

  return (
    <AppShell
      title="Teachers"
      subtitle="Teaching staff, their subjects and class responsibilities"
      actions={<Button icon={Plus} onClick={() => setFormModal({})}>Add teacher</Button>}
    >
      {justCreated && (
        <CredentialsBanner
          title={`${justCreated.teacher?.name ?? 'Teacher'} was added`}
          description={`They can log in with their email and this default password. ${DEFAULT_PASSWORD_HINT}`}
          loginId={justCreated.teacher?.email}
          password={justCreated.defaultPassword ?? '123456'}
          onDismiss={() => setJustCreated(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, phone or ID..." />
        <input
          className={`${inputClass} sm:w-44`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          aria-label="Filter by subject"
        />
        <select className={`${selectClass} sm:w-44`} value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Filter by class">
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="overflow-x-auto shrink-0">
          <StatusFilter value={status} onChange={setStatus} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading}
          error={error}
          empty={teachers.length === 0}
          emptyState={
            <EmptyState
              icon={UserSquare2}
              title={hasFilters ? 'No matching teachers' : 'No teachers yet'}
              message={hasFilters ? 'Try a different search or filter.' : 'Add your first teacher to get started.'}
              action={!hasFilters && <Button icon={Plus} onClick={() => setFormModal({})}>Add teacher</Button>}
            />
          }
        >
          <Table>
            <THead>
              <Th>Teacher</Th>
              <Th>Contact</Th>
              <Th>Expertise</Th>
              <Th>Class teacher</Th>
              <Th>Experience</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {teachers.map((t) => {
                const active = t.status !== 'INACTIVE'
                return (
                  <Tr key={t.id} className="cursor-pointer hover:bg-line/20" onClick={() => navigate(`/teachers/${t.id}`)}>
                    <Td>
                      <p className="font-semibold text-ink whitespace-nowrap">{t.name}</p>
                      <p className="text-xs text-ink/45">{t.employeeId}</p>
                    </Td>
                    <Td>
                      <p className="whitespace-nowrap">{t.email}</p>
                      <p className="text-xs text-ink/45">{t.phone}</p>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1 min-w-[10rem]">
                        {(t.subjectsTaught ?? []).slice(0, 3).map((s) => (
                          <span key={s} className="rounded-full bg-board/8 border border-board/15 text-board px-2 py-0.5 text-xs font-medium">{s}</span>
                        ))}
                        {(t.subjectsTaught?.length ?? 0) > 3 && <span className="text-xs text-ink/45">+{t.subjectsTaught.length - 3}</span>}
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {t.classTeacherOf?.length ? t.classTeacherOf.map((c) => `${c.className} – ${c.sectionName}`).join(', ') : <span className="text-ink/35">—</span>}
                    </Td>
                    <Td className="whitespace-nowrap">{experienceLabel(t.experienceYears, t.experienceMonths)}</Td>
                    <Td>
                      <Badge tone={active ? 'active' : 'inactive'}>{active ? 'Active' : 'Deleted'}</Badge>
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <IconButton icon={Pencil} label={`Edit ${t.name}`} tone="primary" onClick={stop(() => setFormModal({ teacher: t }))} />
                      {active ? (
                        <IconButton icon={Trash2} label={`Delete ${t.name}`} tone="danger" onClick={stop(() => setDeleteTarget(t))} />
                      ) : (
                        <IconButton icon={RotateCcw} label={`Restore ${t.name}`} tone="primary" onClick={stop(() => restore(t))} />
                      )}
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {!loading && !error && teachers.length > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}

      <TeacherFormModal
        open={!!formModal}
        onClose={() => setFormModal(null)}
        teacher={formModal?.teacher}
        classes={classes}
        subjectNames={subjectNames}
        onSaved={handleSaved}
      />

      <DeleteTeacherDialog teacher={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </AppShell>
  )
}
