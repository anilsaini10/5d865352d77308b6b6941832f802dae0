import { useMemo, useState } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { AsyncContent, Button, Card, EmptyState, SearchInput, Table, THead, Th, Tr, Td, Alert } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useClasses } from '../classes/useClasses.js'
import { subjectsApi } from './subjects.api.js'
import SubjectFormModal from './components/SubjectFormModal.jsx'

export default function SubjectsPage() {
  const { notify } = useToast()
  const { data, loading, error, reload } = useFetch(() => subjectsApi.list(), [], { errorMessage: 'Could not load subjects.' })
  const { classes, loading: classesLoading, error: classesError, reload: reloadClasses } = useClasses()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => a.numericLevel - b.numericLevel || a.name.localeCompare(b.name)),
    [classes]
  )

  // subjectId → classes it's linked to, derived from each class's curriculum.
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

  return (
    <AppShell
      title="Subjects"
      subtitle={total > 0 ? `${total} ${total === 1 ? 'subject' : 'subjects'}` : 'Subjects taught at your school'}
      actions={
        <Button icon={Plus} onClick={() => setModalOpen(true)}>
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
                action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Add subject</Button>}
              />
            ) : (
              <EmptyState icon={BookOpen} title="No matching subjects" message="Try a different search." />
            )
          }
        >
          <Table>
            <THead>
              <Th>Subject</Th>
              <Th>Linked classes</Th>
            </THead>
            <tbody>
              {subjects.map((s) => {
                const linked = classesBySubject.get(s.id) ?? []
                return (
                  <Tr key={s.id}>
                    <Td className="font-semibold text-ink whitespace-nowrap">{s.name}</Td>
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
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      <SubjectFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        classes={sortedClasses}
        classesLoading={classesLoading && classes.length === 0}
        onSaved={(subject) => {
          notify(`${subject.name} was created.`, 'success')
          reload()
          reloadClasses()
        }}
      />
    </AppShell>
  )
}
