import { useEffect, useMemo, useState } from 'react'
import { Search, Send, Users } from 'lucide-react'
import { Modal, Field, inputClass, selectClass, Alert, Button, FormActions } from '../../../../components/ui.jsx'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { useClasses } from '../../classes/useClasses.js'
import { studentsApi } from '../../students/students.api.js'
import { useFetch } from '../../../../hooks/useFetch.js'
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue.js'
import { notificationsApi } from '../notifications.api.js'

const TITLE_MAX = 200
const DESC_MAX = 2000

export default function SendTargetedNotificationModal({ open, onClose, onSent }) {
  const { classes, sectionsOf } = useClasses()

  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  const [selected, setSelected] = useState(new Set())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data, loading } = useFetch(
    () => open ? studentsApi.list({ page, pageSize: 50, search: debouncedSearch, classId, sectionId }) : Promise.resolve(null),
    [open, page, debouncedSearch, classId, sectionId],
    { errorMessage: 'Could not load students.' },
  )

  const students = data?.items ?? []

  useEffect(() => {
    if (open) {
      setClassId('')
      setSectionId('')
      setSearch('')
      setPage(1)
      setSelected(new Set())
      setTitle('')
      setDescription('')
      setErrors({})
      setServerError('')
    }
  }, [open])

  const changeClass = (v) => {
    setClassId(v)
    setSectionId('')
    setPage(1)
  }

  const sections = classId ? sectionsOf(classId) : []

  const allOnPageSelected = useMemo(
    () => students.length > 0 && students.every((s) => selected.has(s.id)),
    [students, selected],
  )

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) students.forEach((s) => next.delete(s.id))
      else students.forEach((s) => next.add(s.id))
      return next
    })

  const validate = () => {
    const errs = {}
    if (selected.size === 0) errs.students = 'Select at least one student.'
    if (!title.trim()) errs.title = 'Title is required.'
    else if (title.trim().length > TITLE_MAX) errs.title = `Title must be at most ${TITLE_MAX} characters.`
    if (!description.trim()) errs.description = 'Description is required.'
    else if (description.trim().length > DESC_MAX) errs.description = `Description must be at most ${DESC_MAX} characters.`
    return errs
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const result = await notificationsApi.sendTargeted({
        studentIds: [...selected],
        title: title.trim(),
        description: description.trim(),
      })
      onSent?.(result)
      onClose()
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not send notification.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={submitting ? () => {} : onClose} wide="xl" title="Send to students" subtitle="Select students and send a notification to their parents">
      <form onSubmit={submit} className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
            <input
              className={`${inputClass} pl-9`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name or admission no..."
            />
          </div>
          <select className={`${selectClass} sm:w-40`} value={classId} onChange={(e) => changeClass(e.target.value)} aria-label="Filter by class">
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className={`${selectClass} sm:w-36`} value={sectionId} onChange={(e) => { setSectionId(e.target.value); setPage(1) }} disabled={!classId} aria-label="Filter by section">
            <option value="">{classId ? 'All sections' : 'Section'}</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Selected count */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 text-sm font-medium text-board">
            <Users size={16} />
            {selected.size} student{selected.size !== 1 ? 's' : ''} selected
            <button type="button" className="text-xs text-ink/50 hover:text-ink underline ml-1" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}
        {errors.students && <p className="text-xs text-coral font-medium">{errors.students}</p>}

        {/* Student list */}
        <div className="border border-line rounded-xl max-h-[32vh] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-ink/50 py-6 text-center">Loading students...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-ink/50 py-6 text-center">No students found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-paper border-b border-line">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input type="checkbox" className="accent-board" checked={allOnPageSelected} onChange={togglePage} aria-label="Select all on this page" />
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-ink/60">Student</th>
                  <th className="text-left px-3 py-2 font-semibold text-ink/60">Class</th>
                  <th className="text-left px-3 py-2 font-semibold text-ink/60">Parent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {students.map((s) => (
                  <tr key={s.id} className={`hover:bg-line/20 cursor-pointer ${selected.has(s.id) ? 'bg-board/5' : ''}`} onClick={() => toggleOne(s.id)}>
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" className="accent-board" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} onClick={(e) => e.stopPropagation()} aria-label={`Select ${s.name}`} />
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-ink">{s.name}</span>
                      <span className="text-xs text-ink/45 ml-1.5">{s.admissionNo}</span>
                    </td>
                    <td className="px-3 py-2 text-ink/70 whitespace-nowrap">{s.className}{s.sectionName ? ` – ${s.sectionName}` : ''}</td>
                    <td className="px-3 py-2 text-ink/70">{s.parentName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-ink/50">
            <span>Page {data.page} of {data.totalPages} ({data.total} students)</span>
            <div className="flex gap-2">
              <button type="button" className="px-2 py-1 rounded border border-line hover:bg-line/40 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <button type="button" className="px-2 py-1 rounded border border-line hover:bg-line/40 disabled:opacity-40" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}

        {/* Notification form */}
        <div className="border-t border-line pt-4 space-y-4">
          <Field label="Title" required error={errors.title}>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fees Reminder" maxLength={TITLE_MAX} />
          </Field>
          <Field label="Description" required error={errors.description}>
            <textarea className={`${inputClass} min-h-[96px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write the notification message..." maxLength={DESC_MAX} />
          </Field>
        </div>

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={`Send to ${selected.size || '...'} student${selected.size !== 1 ? 's' : ''}`} />
      </form>
    </Modal>
  )
}
