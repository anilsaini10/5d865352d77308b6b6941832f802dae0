import { useEffect, useMemo, useState } from 'react'
import { Plus, BookOpen, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import Pagination from '../../../components/Pagination.jsx'
import {
  AsyncContent, Badge, Button, Card, ConfirmDialog, EmptyState,
  IconButton, Table, THead, Th, Tr, Td, selectClass,
} from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage, getErrorCode } from '../../../api/httpClient.js'
import { useClasses } from '../classes/useClasses.js'
import { subjectsApi } from '../subjects/subjects.api.js'
import { chaptersApi } from './syllabus.api.js'
import ChapterFormModal from './components/ChapterFormModal.jsx'

const PAGE_SIZE = 50

export default function ChaptersPage() {
  const { notify } = useToast()
  const { classes } = useClasses()

  const [classFilter, setClassFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [page, setPage] = useState(1)

  // Cascading subjects for the selected class filter
  const [filterSubjects, setFilterSubjects] = useState([])
  useEffect(() => {
    if (!classFilter) { setFilterSubjects([]); return }
    let cancelled = false
    subjectsApi.byClass(classFilter)
      .then((data) => { if (!cancelled) setFilterSubjects(data ?? []) })
      .catch(() => { if (!cancelled) setFilterSubjects([]) })
    return () => { cancelled = true }
  }, [classFilter])

  const { data, loading, error, reload } = useFetch(
    () => chaptersApi.list({
      classId: classFilter || undefined,
      subjectId: subjectFilter || undefined,
      isActive: activeFilter === '' ? undefined : activeFilter === 'true',
      page,
      pageSize: PAGE_SIZE,
    }),
    [classFilter, subjectFilter, activeFilter, page],
    { errorMessage: 'Could not load chapters.' }
  )

  const chapters = data?.items ?? []
  const total = data?.total ?? 0

  const [formModal, setFormModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const withPageReset = (setter) => (value) => { setter(value); setPage(1) }

  const handleClassFilterChange = (value) => {
    setClassFilter(value)
    setSubjectFilter('')
    setPage(1)
  }

  const handleSaved = (result, { isEdit }) => {
    notify(isEdit ? `${result?.name ?? 'Chapter'} updated.` : `${result?.name ?? 'Chapter'} created.`, 'success')
    reload()
  }

  const toggleStatus = async (ch) => {
    try {
      await chaptersApi.toggleStatus(ch.id)
      notify(`${ch.name} ${ch.isActive ? 'deactivated' : 'activated'}.`, 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not toggle status.'), 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await chaptersApi.remove(deleteTarget.id)
      notify(`${deleteTarget.name} deactivated.`, 'success')
      if (chapters.length === 1 && page > 1) setPage(page - 1)
      else reload()
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'CHAPTER_HAS_DEPENDENTS') {
        notify('This chapter is used in syllabus plans. It has been deactivated instead.', 'info')
        reload()
      } else {
        notify(getErrorMessage(err, 'Could not delete chapter.'), 'error')
      }
    }
  }

  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => a.numericLevel - b.numericLevel),
    [classes]
  )

  const hasFilters = !!(classFilter || subjectFilter || activeFilter)

  const emptyState = hasFilters ? (
    <EmptyState icon={BookOpen} title="No matching chapters" message="Try different filters." />
  ) : (
    <EmptyState
      icon={BookOpen}
      title="No chapters yet"
      message="Create chapters and assign them to subjects and classes."
      action={<Button icon={Plus} onClick={() => setFormModal({})}>Add chapter</Button>}
    />
  )

  return (
    <AppShell
      title="Chapters"
      subtitle={total > 0 ? `${total} chapter${total === 1 ? '' : 's'}` : 'Manage syllabus chapters'}
      actions={<Button icon={Plus} onClick={() => setFormModal({})}>Add chapter</Button>}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select
          className={`${selectClass} sm:w-48`}
          value={classFilter}
          onChange={(e) => handleClassFilterChange(e.target.value)}
          aria-label="Filter by class"
        >
          <option value="">All classes</option>
          {sortedClasses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className={`${selectClass} sm:w-48`}
          value={subjectFilter}
          onChange={(e) => withPageReset(setSubjectFilter)(e.target.value)}
          aria-label="Filter by subject"
          disabled={!classFilter}
        >
          <option value="">{classFilter ? 'All subjects' : 'Select class first'}</option>
          {filterSubjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          className={`${selectClass} sm:w-40`}
          value={activeFilter}
          onChange={(e) => withPageReset(setActiveFilter)(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <AsyncContent loading={loading} error={error} empty={chapters.length === 0} emptyState={emptyState}>
          <Table>
            <THead>
              <Th>#</Th>
              <Th>Ch. No</Th>
              <Th>Name</Th>
              <Th>Subject</Th>
              <Th>Class</Th>
              <Th>Expected Days</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {chapters.map((ch, i) => (
                <Tr key={ch.id} className="hover:bg-line/20">
                  <Td className="text-ink/50">{(page - 1) * PAGE_SIZE + i + 1}</Td>
                  <Td className="font-semibold text-ink">{ch.chapterNumber}</Td>
                  <Td>
                    <span className="block font-semibold text-ink">{ch.name}</span>
                    {ch.description && <span className="block text-xs text-ink/50 truncate max-w-xs">{ch.description}</span>}
                  </Td>
                  <Td className="whitespace-nowrap">{ch.subject?.name ?? '—'}</Td>
                  <Td className="whitespace-nowrap">{ch.class?.name ?? '—'}</Td>
                  <Td>{ch.expectedWorkingDays}</Td>
                  <Td>
                    <Badge tone={ch.isActive ? 'active' : 'inactive'}>{ch.isActive ? 'Active' : 'Inactive'}</Badge>
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <IconButton icon={Pencil} label={`Edit ${ch.name}`} tone="primary" onClick={() => setFormModal({ chapter: ch })} />
                      <IconButton
                        icon={ch.isActive ? ToggleRight : ToggleLeft}
                        label={ch.isActive ? 'Deactivate' : 'Activate'}
                        tone={ch.isActive ? 'neutral' : 'primary'}
                        onClick={() => toggleStatus(ch)}
                      />
                      <IconButton icon={Trash2} label={`Delete ${ch.name}`} tone="danger" onClick={() => setDeleteTarget(ch)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      {!loading && !error && chapters.length > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onChange={setPage} />
      )}

      <ChapterFormModal
        open={!!formModal}
        onClose={() => setFormModal(null)}
        chapter={formModal?.chapter ?? null}
        classes={sortedClasses}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this chapter?"
        message={`"${deleteTarget?.name}" will be deactivated. If it's used in syllabus plans, it can only be deactivated, not fully removed.`}
        confirmLabel="Delete"
      />
    </AppShell>
  )
}
