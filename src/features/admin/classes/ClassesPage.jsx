import { useMemo, useState } from 'react'
import { Plus, Layers } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { AsyncContent, Button, ConfirmDialog, EmptyState, SearchInput, Alert } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'
import { formatNumber } from '../../../utils/format.js'
import { useClasses } from './useClasses.js'
import { classesApi } from './classes.api.js'
import { subjectsApi } from '../subjects/subjects.api.js'
import ClassCard from './components/ClassCard.jsx'
import ClassFormModal from './components/ClassFormModal.jsx'
import SectionFormModal from './components/SectionFormModal.jsx'

export default function ClassesPage() {
  const { notify } = useToast()
  const { classes, loading, error, reload } = useClasses()
  const { data: subjects, error: subjectsError } = useFetch(() => subjectsApi.list(), [], {
    errorMessage: 'Could not load subjects.',
  })

  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(() => new Set())
  const [classModal, setClassModal] = useState(null) // { schoolClass? }
  const [sectionModal, setSectionModal] = useState(null) // { schoolClass, section? }
  const [deleteClassTarget, setDeleteClassTarget] = useState(null)
  const [deleteSectionTarget, setDeleteSectionTarget] = useState(null) // { schoolClass, section }

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...classes]
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => a.numericLevel - b.numericLevel || a.name.localeCompare(b.name))
  }, [classes, search])

  const totals = useMemo(
    () => ({
      sections: classes.reduce((n, c) => n + (c.sections?.length ?? 0), 0),
      students: classes.reduce((n, c) => n + (c.totalStudents ?? 0), 0),
    }),
    [classes]
  )

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const deleteClass = async () => {
    const target = deleteClassTarget
    try {
      await classesApi.remove(target.id)
      notify(`${target.name} was deleted.`, 'success')
      reload()
    } catch (err) {
      if (getErrorCode(err) === 'CLASS_HAS_STUDENTS') {
        notify(`${target.name} can't be deleted because students (including deleted ones) are still linked to it.`, 'error')
      } else {
        notify(getErrorMessage(err, 'Could not delete class.'), 'error')
      }
    }
  }

  const deleteSection = async () => {
    const { schoolClass, section } = deleteSectionTarget
    const label = `${schoolClass.name} – ${section.name}`
    try {
      await classesApi.removeSection(schoolClass.id, section.id)
      notify(`Section ${label} was deleted.`, 'success')
      reload()
    } catch (err) {
      if (getErrorCode(err) === 'SECTION_HAS_STUDENTS') {
        notify(`Section ${label} can't be deleted because students (including deleted ones) are still linked to it.`, 'error')
      } else {
        notify(getErrorMessage(err, 'Could not delete section.'), 'error')
      }
    }
  }

  const linkSubject = (schoolClass) => async (subjectId) => {
    const subject = subjects?.find((s) => s.id === subjectId)
    try {
      await classesApi.linkSubject(schoolClass.id, subjectId)
      notify(`${subject?.name ?? 'Subject'} linked to ${schoolClass.name}.`, 'success')
      reload()
      return true
    } catch (err) {
      notify(getErrorMessage(err, 'Could not link subject.'), 'error')
      return false
    }
  }

  const showInitialLoader = loading && classes.length === 0

  return (
    <AppShell
      title="Classes"
      subtitle={
        classes.length > 0
          ? `${classes.length} classes · ${totals.sections} sections · ${formatNumber(totals.students)} active students`
          : 'Classes, sections and curriculum'
      }
      actions={
        <Button icon={Plus} onClick={() => setClassModal({})}>
          <span className="hidden sm:inline">Create class</span>
          <span className="sm:hidden">New</span>
        </Button>
      }
    >
      {classes.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search classes..." />
        </div>
      )}

      {subjectsError && <Alert tone="warning" className="mb-4">{subjectsError} Linking subjects is unavailable.</Alert>}

      <AsyncContent
        loading={showInitialLoader}
        error={classes.length === 0 ? error : ''}
        empty={sorted.length === 0}
        emptyState={
          <div className="bg-surface border border-line rounded-2xl shadow-card">
            {classes.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No classes yet"
                message="Create your first class along with its sections to start enrolling students."
                action={<Button icon={Plus} onClick={() => setClassModal({})}>Create class</Button>}
              />
            ) : (
              <EmptyState icon={Layers} title="No matching classes" message="Try a different search." />
            )}
          </div>
        }
      >
        {error && <Alert className="mb-4">{error}</Alert>}
        <div className="space-y-3">
          {sorted.map((c) => (
            <ClassCard
              key={c.id}
              schoolClass={c}
              expanded={expanded.has(c.id)}
              onToggle={() => toggle(c.id)}
              subjects={subjects}
              onEdit={() => setClassModal({ schoolClass: c })}
              onDelete={() => setDeleteClassTarget(c)}
              onAddSection={() => setSectionModal({ schoolClass: c })}
              onEditSection={(section) => setSectionModal({ schoolClass: c, section })}
              onDeleteSection={(section) => setDeleteSectionTarget({ schoolClass: c, section })}
              onLinkSubject={linkSubject(c)}
            />
          ))}
        </div>
      </AsyncContent>

      <ClassFormModal
        open={!!classModal}
        onClose={() => setClassModal(null)}
        schoolClass={classModal?.schoolClass}
        onSaved={({ isEdit, name }) => {
          notify(isEdit ? `${name} was updated.` : `${name} was created.`, 'success')
          reload()
        }}
      />

      <SectionFormModal
        open={!!sectionModal}
        onClose={() => setSectionModal(null)}
        schoolClass={sectionModal?.schoolClass}
        section={sectionModal?.section}
        classes={classes}
        onSaved={({ isEdit, name }) => {
          const className = sectionModal?.schoolClass?.name
          notify(isEdit ? `Section ${className} – ${name} was updated.` : `Section ${name} added to ${className}.`, 'success')
          if (!isEdit && sectionModal?.schoolClass) setExpanded((prev) => new Set(prev).add(sectionModal.schoolClass.id))
          reload()
        }}
      />

      <ConfirmDialog
        open={!!deleteClassTarget}
        onClose={() => setDeleteClassTarget(null)}
        onConfirm={deleteClass}
        title={`Delete ${deleteClassTarget?.name ?? 'class'}?`}
        confirmLabel="Delete class"
        message={
          <>
            This permanently deletes the class along with its sections, subject links and teacher assignments. It can't be
            undone. A class that has any students — including deleted students — can't be deleted.
          </>
        }
      />

      <ConfirmDialog
        open={!!deleteSectionTarget}
        onClose={() => setDeleteSectionTarget(null)}
        onConfirm={deleteSection}
        title={`Delete section ${deleteSectionTarget ? `${deleteSectionTarget.schoolClass.name} – ${deleteSectionTarget.section.name}` : ''}?`}
        confirmLabel="Delete section"
        message="This permanently deletes the section. A section that has any students — including deleted students — can't be deleted."
      />
    </AppShell>
  )
}
