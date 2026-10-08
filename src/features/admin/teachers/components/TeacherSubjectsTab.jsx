import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, X } from 'lucide-react'
import {
  Alert, Button, Card, ConfirmDialog, EmptyState, Field, IconButton, Table, THead, Th, Tr, Td, selectClass,
} from '../../../../components/ui.jsx'
import { getErrorCode, getErrorMessage } from '../../../../api/httpClient.js'
import { useToast } from '../../../../context/ToastContext.jsx'
import { teachersApi } from '../teachers.api.js'
import { validateSubjectAssignment } from '../teachers.validation.js'

/** Subject + class assignments (what the teacher can be timetabled for). */
export default function TeacherSubjectsTab({ teacher, classes, subjectNames, onChanged }) {
  const { notify } = useToast()
  const [form, setForm] = useState({ subject: '', classId: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [inUseError, setInUseError] = useState(null)

  const assignments = teacher.subjects ?? []
  const inactive = teacher.status === 'INACTIVE'

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validationErrors = validateSubjectAssignment(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) return

    setSubmitting(true)
    try {
      await teachersApi.assignSubject(teacher.id, { subject: form.subject, classId: form.classId })
      notify(`${form.subject} assigned.`, 'success')
      setForm({ subject: '', classId: '' })
      onChanged()
    } catch (err) {
      if (getErrorCode(err) === 'SUBJECT_ALREADY_ASSIGNED') {
        setErrors({ subject: 'This subject is already assigned to the teacher for that class.' })
      } else setServerError(getErrorMessage(err, 'Could not assign subject.'))
    } finally {
      setSubmitting(false)
    }
  }

  const confirmRemove = async () => {
    const a = removeTarget
    setInUseError(null)
    try {
      await teachersApi.unassignSubject(teacher.id, a.subjectId, a.classId)
      notify(`${a.name} (${a.className}) removed.`, 'success')
      onChanged()
    } catch (err) {
      if (getErrorCode(err) === 'SUBJECT_ASSIGNMENT_IN_USE') setInUseError(a)
      else notify(getErrorMessage(err, 'Could not remove the assignment.'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      {inUseError && (
        <Alert tone="warning">
          {inUseError.name} for {inUseError.className} is still used by timetable periods. Remove or reassign those
          periods in the{' '}
          <Link to="/timetable" className="underline font-semibold">Timetable</Link> first, then try again.
        </Alert>
      )}

      {!inactive && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink mb-3">Assign a subject</h3>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-start">
            <Field label="Subject" required error={errors.subject}>
              <select className={selectClass} value={form.subject} onChange={set('subject')}>
                <option value="">Select subject</option>
                {subjectNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </Field>
            <Field label="Class" required error={errors.classId}>
              <select className={selectClass} value={form.classId} onChange={set('classId')}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Button type="submit" icon={Plus} loading={submitting} className="sm:mt-7">Assign</Button>
          </form>
          <Alert className="mt-3">{serverError}</Alert>
        </Card>
      )}

      <Card className="overflow-hidden">
        {assignments.length === 0 ? (
          <EmptyState icon={BookOpen} title="No subjects assigned" message="Assign subjects per class so this teacher can be scheduled in the timetable." />
        ) : (
          <Table>
            <THead>
              <Th>Subject</Th>
              <Th>Class</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {assignments.map((a) => (
                <Tr key={`${a.subjectId}-${a.classId}`}>
                  <Td className="font-semibold text-ink">{a.name}</Td>
                  <Td>{a.className}</Td>
                  <Td className="text-right">
                    <IconButton icon={X} label={`Remove ${a.name} for ${a.className}`} onClick={() => setRemoveTarget(a)} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        danger={false}
        title="Remove subject assignment?"
        confirmLabel="Remove"
        message={`${teacher.name} will no longer be assigned ${removeTarget?.name} for ${removeTarget?.className}. This isn't possible while timetable periods still use it.`}
      />
    </div>
  )
}
