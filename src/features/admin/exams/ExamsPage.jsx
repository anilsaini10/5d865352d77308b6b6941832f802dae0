import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import { AsyncContent, Button, Card, ConfirmDialog, EmptyState, IconButton, SearchInput, Table, THead, Th, Tr, Td } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { useClasses } from '../classes/useClasses.js'
import { examsApi } from './exams.api.js'
import ExamFormModal from './components/ExamFormModal.jsx'
import { ExamDeleteMessage } from './components/ExamDeleteMessage.jsx'
import { examDates } from './components/examFormat.js'

const PAGE_SIZE = 15

export default function ExamsPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { classes } = useClasses()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  const { data, loading, error, reload } = useFetch(
    () => examsApi.list({ page, pageSize: PAGE_SIZE, search: debouncedSearch }),
    [page, debouncedSearch],
    { errorMessage: 'Could not load exams.' }
  )

  const [modal, setModal] = useState({ open: false, exam: null })
  const [deleting, setDeleting] = useState(null)

  const onSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

  const onSaved = (saved, { isEdit }) => {
    notify(isEdit ? 'Exam updated.' : 'Exam created.', 'success')
    if (!isEdit && saved?.id) navigate(`/exams/${saved.id}`)
    else reload()
  }

  const confirmDelete = async () => {
    try {
      await examsApi.remove(deleting.id)
      notify('Exam deleted.', 'success')
      if (data?.items.length === 1 && page > 1) setPage(page - 1)
      else reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete the exam.'), 'error')
    }
  }

  const items = data?.items ?? []

  return (
    <AppShell
      title="Exams"
      subtitle="Create exams, assign classes and record results"
      actions={
        <Button icon={Plus} onClick={() => setModal({ open: true, exam: null })}>
          <span className="hidden sm:inline">New exam</span>
        </Button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput value={search} onChange={onSearch} placeholder="Search exams by title…" />
      </div>

      <Card>
        <AsyncContent
          loading={loading}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={ClipboardList}
              title={debouncedSearch ? 'No matching exams' : 'No exams yet'}
              message={debouncedSearch ? 'Try a different search term.' : 'Create an exam to start recording marks for your classes.'}
              action={!debouncedSearch && (
                <Button icon={Plus} onClick={() => setModal({ open: true, exam: null })}>New exam</Button>
              )}
            />
          }
        >
          <Table>
            <THead>
              <Th>Exam</Th>
              <Th>Dates</Th>
              <Th>Classes</Th>
              <Th>Created by</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {items.map((exam) => (
                <Tr key={exam.id} className="hover:bg-line/20 cursor-pointer" onClick={() => navigate(`/exams/${exam.id}`)}>
                  <Td className="min-w-[200px]">
                    <p className="font-semibold text-ink">{exam.title}</p>
                    {exam.description && <p className="text-xs text-ink/50 line-clamp-1 mt-0.5">{exam.description}</p>}
                  </Td>
                  <Td className="whitespace-nowrap">{examDates(exam)}</Td>
                  <Td className="min-w-[180px]">
                    <div className="flex flex-wrap gap-1.5">
                      {(exam.classes ?? []).length === 0 && <span className="text-ink/40">—</span>}
                      {(exam.classes ?? []).map((c) => (
                        <span key={c.classId} className="inline-flex items-center rounded-full bg-board/10 border border-board/15 text-board text-xs font-semibold px-2 py-0.5 whitespace-nowrap">
                          {c.className}
                          <span className="ml-1 font-normal text-board/60">/ {c.maxMarks}</span>
                        </span>
                      ))}
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap">{exam.createdBy?.name || '—'}</Td>
                  <Td className="text-right whitespace-nowrap">
                    <div className="inline-flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <IconButton icon={Pencil} label={`Edit ${exam.title}`} tone="primary" onClick={() => setModal({ open: true, exam })} />
                      <IconButton icon={Trash2} label={`Delete ${exam.title}`} tone="danger" onClick={() => setDeleting(exam)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}

      <ExamFormModal
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        exam={modal.exam}
        classes={classes}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete exam permanently?"
        confirmLabel="Delete permanently"
        message={deleting && <ExamDeleteMessage title={deleting.title} />}
      />
    </AppShell>
  )
}
