import { useMemo, useState } from 'react'
import { Plus, BookOpen, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import {
  AsyncContent, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton,
  SearchInput, Table, THead, Th, Tr, Td, Alert,
} from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { getErrorMessage, getErrorCode } from '../../../api/httpClient.js'
import { useClasses } from '../classes/useClasses.js'
import { subjectsApi } from './subjects.api.js'
import SubjectFormModal from './components/SubjectFormModal.jsx'

export default function SubjectsPage() {
  const { notify } = useToast()
  const { data, loading, error, reload } = useFetch(() => subjectsApi.list(), [], { errorMessage: 'Could not load subjects.' })
  const { classes, loading: classesLoading, error: classesError, reload: reloadClasses } = useClasses()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)

  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => a.numericLevel - b.numericLevel || a.name.localeCompare(b.name)),
    [classes],
  )

  const classesBySubject = useMemo(() => {
    const map = new Map()
    for (const c of sortedClasses) {
      for (const s of c.subjects ?? []) {
        if (!map.has(s.id)) map.set(s.id, [])
        map.get(s.id).push(c)
      }
    }
    return map
  }, [sortedClasses])

  const subjects = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...(data ?? [])]
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data, search])

  const total = data?.length ?? 0

  const openEdit = (subject) => {
    setEditing({ ...subject, classes: classesBySubject.get(subject.id) ?? [] })
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleToggleStatus = async (subject) => {
    setToggling(subject.id)
    try {
      await subjectsApi.toggleStatus(subject.id)
      notify(`${subject.name} ${subject.isActive ? 'deactivated' : 'activated'}.`, 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not toggle status.'), 'error')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await subjectsApi.remove(deleting.id)
      notify(`${deleting.name} deleted.`, 'success')
      setDeleting(null)
      reload()
      reloadClasses()
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'SUBJECT_HAS_DEPENDENTS') {
        notify('Cannot delete — this subject is used by chapters or plans.', 'error')
      } else {
        notify(getErrorMessage(err, 'Could not delete subject.'), 'error')
      }
      setDeleting(null)
    }
  }

  return (
    <AppShell
      title="Subjects"
      subtitle={total > 0 ? `${total} ${total === 1 ? 'subject' : 'subjects'}` : 'Subjects taught at your school'}
      actions={
        <Button icon={Plus} onClick={openCreate}>
          <span className="hidden sm:inline">Add subject</span>
          <span className="sm:hidden">New</span>
        </Button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search subjects..." />
      </div>

      {classesError && <Alert tone="warning" className="mb-4">{classesError} Linked classes can't be shown.</Alert>}

      <Card>
        <AsyncContent
          loading={loading && !data}
          error={error}
          empty={subjects.length === 0}
          emptyState={
            total === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No subjects yet"
                message="Add subjects, then link them to classes to build each class's curriculum."
                action={<Button icon={Plus} onClick={openCreate}>Add subject</Button>}
              />
            ) : (
              <EmptyState icon={BookOpen} title="No matching subjects" message="Try a different search." />
            )
          }
        >
          <Table>
            <THead>
              <Th>Subject</Th>
              <Th>Status</Th>
              <Th>Linked classes</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {subjects.map((s) => {
                const linked = classesBySubject.get(s.id) ?? []
                const isActive = s.isActive !== false
                return (
                  <Tr key={s.id}>
                    <Td className="font-semibold text-ink whitespace-nowrap">{s.name}</Td>
                    <Td>
                      <Badge tone={isActive ? 'success' : 'neutral'}>{isActive ? 'Active' : 'Inactive'}</Badge>
                    </Td>
                    <Td>
                      {classesLoading && classes.length === 0 ? (
                        <span className="text-ink/40">…</span>
                      ) : linked.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {linked.map((c) => (
                            <span
                              key={c.id}
                              className="inline-flex items-center rounded-full border border-line bg-paper px-2.5 py-0.5 text-xs font-semibold text-ink/75 whitespace-nowrap"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-ink/45 italic">Not linked to any class</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={isActive ? ToggleRight : ToggleLeft}
                          label={isActive ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggleStatus(s)}
                          disabled={toggling === s.id}
                        />
                        <IconButton icon={Pencil} label="Edit" onClick={() => openEdit(s)} />
                        <IconButton icon={Trash2} label="Delete" variant="danger" onClick={() => setDeleting(s)} />
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      <SubjectFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        subject={editing}
        classes={sortedClasses}
        classesLoading={classesLoading && classes.length === 0}
        onSaved={(subject) => {
          notify(`${subject.name} was ${editing ? 'updated' : 'created'}.`, 'success')
          reload()
          reloadClasses()
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete subject"
        message={`Are you sure you want to delete "${deleting?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </AppShell>
  )
}
