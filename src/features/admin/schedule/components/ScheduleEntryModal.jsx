import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Coffee } from 'lucide-react'
import { Modal, Field, inputClass, selectClass, Alert, FormActions, Tabs } from '../../../../components/ui.jsx'
import { getErrorMessage, getErrorCode } from '../../../../api/httpClient.js'
import { DAYS, DAY_LABELS, SCHEDULE_TYPES } from '../../constants.js'
import { scheduleApi } from '../schedule.api.js'
import { validateScheduleForm, toHHMM } from '../schedule.validation.js'

const TYPE_OPTIONS = [
  { value: SCHEDULE_TYPES.CLASS_PERIOD, label: 'Class period' },
  { value: SCHEDULE_TYPES.BREAK, label: 'Break' },
]

const emptyForm = (day) => ({
  type: SCHEDULE_TYPES.CLASS_PERIOD,
  day: day || 'MONDAY',
  startTime: '',
  endTime: '',
  subjectId: '',
  teacherId: '',
  roomNo: '',
  title: '',
})

const fromEntry = (entry) => ({
  type: entry.type,
  day: entry.day,
  startTime: toHHMM(entry.startTime),
  endTime: toHHMM(entry.endTime),
  subjectId: entry.subjectId || '',
  teacherId: entry.teacherId || '',
  roomNo: entry.roomNo || '',
  title: entry.title || '',
})

/** 'class' → teaches this subject in this class, 'subject' → teaches it somewhere / lists it as expertise, null → no match. */
function teacherMatch(teacher, subject, classId) {
  if (!subject) return null
  const assignments = teacher.subjects ?? []
  if (assignments.some((s) => s.subjectId === subject.id && s.classId === classId)) return 'class'
  const name = subject.name?.trim().toLowerCase()
  if (assignments.some((s) => s.subjectId === subject.id)) return 'subject'
  if ((teacher.subjectsTaught ?? []).some((n) => n?.trim().toLowerCase() === name)) return 'subject'
  return null
}

/**
 * Add / edit one timetable entry. classId, sectionId and type are immutable
 * once created, so they're read-only in edit mode. No period number input —
 * the backend computes it from time order.
 */
export default function ScheduleEntryModal({ open, onClose, entry, section, defaultDay, classSubjects, allSubjects, teachers, onSaved }) {
  const isEdit = !!entry
  const [form, setForm] = useState(() => emptyForm(defaultDay))
  const [showAllSubjects, setShowAllSubjects] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      const next = entry ? fromEntry(entry) : emptyForm(defaultDay)
      setForm(next)
      const linked = classSubjects.some((s) => s.id === next.subjectId)
      setShowAllSubjects(!!next.subjectId && !linked)
    }
    setErrors({})
    setServerError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry, defaultDay])

  const set = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((errs) => ({ ...errs, [key]: undefined, ...(key === 'startTime' || key === 'endTime' ? { time: undefined } : {}) }))
  }

  const isPeriod = form.type === SCHEDULE_TYPES.CLASS_PERIOD

  const subjectOptions = useMemo(() => {
    const base = showAllSubjects || classSubjects.length === 0 ? allSubjects : classSubjects
    const list = [...base]
    // Keep the saved subject selectable even if it's no longer linked to the class.
    if (entry?.subjectId && !list.some((s) => s.id === entry.subjectId)) {
      list.push({ id: entry.subjectId, name: entry.subjectName || 'Current subject' })
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [showAllSubjects, classSubjects, allSubjects, entry])

  const selectedSubject = subjectOptions.find((s) => s.id === form.subjectId) || allSubjects.find((s) => s.id === form.subjectId)

  const teacherGroups = useMemo(() => {
    const groups = { class: [], subject: [], other: [] }
    teachers.forEach((t) => groups[teacherMatch(t, selectedSubject, section.classId) ?? 'other'].push(t))
    if (entry?.teacherId && !teachers.some((t) => t.id === entry.teacherId)) {
      groups.other.push({ id: entry.teacherId, name: entry.teacherName || 'Current teacher' })
    }
    Object.values(groups).forEach((g) => g.sort((a, b) => a.name.localeCompare(b.name)))
    return groups
  }, [teachers, selectedSubject, section.classId, entry])

  const selectedTeacherMatch = form.teacherId
    ? teacherMatch(teachers.find((t) => t.id === form.teacherId) ?? {}, selectedSubject, section.classId)
    : null

  const teacherHint = !selectedSubject
    ? 'Pick a subject first to see who teaches it.'
    : form.teacherId && !selectedTeacherMatch
      ? `This teacher isn't listed as teaching ${selectedSubject.name} — the save may be rejected.`
      : teacherGroups.class.length + teacherGroups.subject.length > 0
        ? `Teachers who teach ${selectedSubject.name} are listed first.`
        : `No teacher is listed for ${selectedSubject.name} yet.`

  const buildPayload = () => {
    const values = {
      day: form.day,
      startTime: form.startTime,
      endTime: form.endTime,
      roomNo: form.roomNo.trim(),
      ...(isPeriod ? { subjectId: form.subjectId, teacherId: form.teacherId } : { title: form.title.trim() }),
    }

    if (!isEdit) {
      const body = { classId: section.classId, sectionId: section.sectionId, type: form.type, ...values }
      if (!body.roomNo) delete body.roomNo
      return body
    }

    // PATCH only what changed; a cleared room is sent as null.
    const original = fromEntry(entry)
    const body = {}
    Object.entries(values).forEach(([key, value]) => {
      const before = key === 'roomNo' || key === 'title' ? original[key].trim() : original[key]
      if (value !== before) body[key] = key === 'roomNo' && !value ? null : value
    })
    return body
  }

  const applyServerError = (err) => {
    const code = getErrorCode(err)
    const message = getErrorMessage(err, isEdit ? 'Could not update the entry.' : 'Could not add the entry.')
    const dayLabel = DAY_LABELS[form.day]
    switch (code) {
      case 'SECTION_NOT_FOUND':
        setServerError('This section no longer exists. Close this dialog and pick the class and section again.')
        break
      case 'SUBJECT_NOT_ASSIGNED':
        setErrors({ teacherId: `This teacher doesn't teach ${selectedSubject?.name ?? 'this subject'}. Pick a teacher who does, or add the subject to the teacher's profile first.` })
        setServerError(message)
        break
      case 'TIME_OVERLAP_SECTION':
        setErrors({ time: `This time overlaps another period or break for this section on ${dayLabel}. Adjust the start or end time.` })
        setServerError(message)
        break
      case 'TEACHER_TIME_CONFLICT':
        setErrors({ teacherId: `This teacher is already scheduled in another class on ${dayLabel} at this time. Choose another teacher or time.` })
        setServerError(message)
        break
      case 'ROOM_TIME_CONFLICT':
        setErrors({ roomNo: `Room ${form.roomNo.trim()} is already booked on ${dayLabel} at this time. Choose another room or time.` })
        setServerError(message)
        break
      default:
        setServerError(message)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validationErrors = validateScheduleForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const body = buildPayload()
    if (isEdit && Object.keys(body).length === 0) {
      onClose()
      return
    }

    setSubmitting(true)
    try {
      if (isEdit) await scheduleApi.update(entry.id, body)
      else await scheduleApi.create(body)
      onSaved({ isEdit })
      onClose()
    } catch (err) {
      applyServerError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const sectionLabel = `${section.className ?? ''} – ${section.sectionName ?? ''}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={isEdit ? (isPeriod ? 'Edit period' : 'Edit break') : 'Add to timetable'}
      subtitle={sectionLabel}
    >
      <form onSubmit={submit} className="space-y-4">
        {isEdit ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-line bg-line/20 px-4 py-3 text-sm">
            <div>
              <p className="text-xs text-ink/45">Class</p>
              <p className="font-semibold text-ink">{entry.className || section.className}</p>
            </div>
            <div>
              <p className="text-xs text-ink/45">Section</p>
              <p className="font-semibold text-ink">{entry.sectionName || section.sectionName}</p>
            </div>
            <div>
              <p className="text-xs text-ink/45">Type</p>
              <p className="font-semibold text-ink">{isPeriod ? 'Class period' : 'Break'}</p>
            </div>
            <p className="sm:col-span-3 text-xs text-ink/50">
              Class, section and type can't be changed. To change the type, delete this entry and add a new one.
            </p>
          </div>
        ) : (
          <div>
            <span className="text-sm font-semibold text-ink/80">Type</span>
            <div className="mt-1.5">
              <Tabs options={TYPE_OPTIONS} value={form.type} onChange={(type) => setForm((f) => ({ ...f, type }))} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Day" required error={errors.day}>
            <select className={selectClass} value={form.day} onChange={set('day')}>
              {DAYS.map((d) => (
                <option key={d} value={d}>{DAY_LABELS[d]}</option>
              ))}
            </select>
          </Field>
          <Field label="Start time" required error={errors.startTime}>
            <input type="time" className={inputClass} value={form.startTime} onChange={set('startTime')} />
          </Field>
          <Field label="End time" required error={errors.endTime}>
            <input type="time" className={inputClass} value={form.endTime} onChange={set('endTime')} />
          </Field>
        </div>
        {errors.time && <p className="text-xs text-coral font-medium -mt-2">{errors.time}</p>}

        {isPeriod ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Field
                label="Subject"
                required
                error={errors.subjectId}
                hint={classSubjects.length === 0 ? 'No subjects are linked to this class — showing all subjects.' : undefined}
              >
                <select className={selectClass} value={form.subjectId} onChange={set('subjectId')}>
                  <option value="">Select a subject</option>
                  {subjectOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
              {classSubjects.length > 0 && (
                <label className="mt-2 flex items-center gap-2 text-xs text-ink/60 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-board"
                    checked={showAllSubjects}
                    onChange={(e) => setShowAllSubjects(e.target.checked)}
                  />
                  Show all school subjects (not just this class's)
                </label>
              )}
            </div>

            <Field label="Teacher" required error={errors.teacherId} hint={teacherHint}>
              <select className={selectClass} value={form.teacherId} onChange={set('teacherId')}>
                <option value="">Select a teacher</option>
                {teacherGroups.class.length > 0 && (
                  <optgroup label={`Teaches ${selectedSubject?.name} in this class`}>
                    {teacherGroups.class.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                )}
                {teacherGroups.subject.length > 0 && (
                  <optgroup label={`Teaches ${selectedSubject?.name}`}>
                    {teacherGroups.subject.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                )}
                {teacherGroups.other.length > 0 && (
                  <optgroup label={selectedSubject ? 'Other teachers' : 'All teachers'}>
                    {teacherGroups.other.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </Field>
          </div>
        ) : (
          <Field label="Title" required error={errors.title}>
            <input className={inputClass} value={form.title} onChange={set('title')} placeholder="Lunch Break" />
          </Field>
        )}

        <Field label="Room" error={errors.roomNo} hint="Optional, e.g. 101 or Lab 2">
          <input className={inputClass} value={form.roomNo} onChange={set('roomNo')} placeholder="101" />
        </Field>

        <div className="flex items-center gap-2 text-xs text-ink/50">
          {isPeriod ? <BookOpen size={14} /> : <Coffee size={14} />}
          Period numbers are assigned automatically from the start times.
        </div>

        <Alert>{serverError}</Alert>

        <FormActions onCancel={onClose} submitting={submitting} submitLabel={isEdit ? 'Save changes' : isPeriod ? 'Add period' : 'Add break'} />
      </form>
    </Modal>
  )
}
