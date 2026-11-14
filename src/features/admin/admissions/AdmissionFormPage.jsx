import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../../components/AppShell.jsx'
import { Button, Card, Field, inputClass, selectClass, Alert, FormActions } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { useClasses } from '../classes/useClasses.js'
import { useAcademicSessions } from '../academicSessions/useAcademicSessions.js'
import { GENDERS, BLOOD_GROUPS } from '../constants.js'
import { admissionsApi } from './admissions.api.js'

const INITIAL_STATUS_OPTIONS = [
  { value: 'INQUIRY', label: 'Inquiry' },
  { value: 'APPLIED', label: 'Applied' },
]

export default function AdmissionFormPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { classes } = useClasses()
  const { sessions } = useAcademicSessions()

  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const [studentName, setStudentName] = useState('')
  const [gender, setGender] = useState('MALE')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [classId, setClassId] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [previousSchool, setPreviousSchool] = useState('')
  const [address, setAddress] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [academicSessionId, setAcademicSessionId] = useState('')
  const [status, setStatus] = useState('INQUIRY')
  const [remarks, setRemarks] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSubmitting(true)
    try {
      const body = {
        studentName: studentName.trim(),
        gender,
        dateOfBirth,
        classId,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentEmail: parentEmail.trim().toLowerCase(),
        previousSchool: previousSchool.trim() || undefined,
        address: address.trim() || undefined,
        bloodGroup: bloodGroup || undefined,
        academicSessionId: academicSessionId || undefined,
        status,
        remarks: remarks.trim() || undefined,
      }
      const result = await admissionsApi.create(body)
      notify(`Admission created — ${result.applicationNo}`, 'success')
      navigate(`/admissions/${result.id}`)
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not create admission.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell title="New Admission" subtitle="Create a new inquiry or application" onBack={() => navigate('/admissions')}>
      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Student Name" required>
              <input className={inputClass} value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Full name" required minLength={2} />
            </Field>
            <Field label="Gender" required>
              <div className="flex items-center gap-4 mt-2">
                {GENDERS.map((g) => (
                  <label key={g.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="gender" value={g.value} checked={gender === g.value} onChange={() => setGender(g.value)} className="text-board" />
                    <span className="text-sm text-ink/80">{g.label}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Date of Birth" required>
              <input type="date" className={inputClass} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
            </Field>
            <Field label="Class Applying For" required>
              <select className={selectClass} value={classId} onChange={(e) => setClassId(e.target.value)} required>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <hr className="border-line" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Parent Name" required>
              <input className={inputClass} value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Full name" required minLength={2} />
            </Field>
            <Field label="Parent Phone" required>
              <input className={inputClass} value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="10-digit mobile" required />
            </Field>
            <Field label="Parent Email" required>
              <input type="email" className={inputClass} value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="email@example.com" required />
            </Field>
          </div>

          <hr className="border-line" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Previous School">
              <input className={inputClass} value={previousSchool} onChange={(e) => setPreviousSchool(e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Blood Group">
              <select className={selectClass} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Optional" />
              </Field>
            </div>
          </div>

          <hr className="border-line" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Academic Session">
              <select className={selectClass} value={academicSessionId} onChange={(e) => setAcademicSessionId(e.target.value)}>
                <option value="">Select session (optional)</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (Current)' : ''}</option>
                ))}
              </select>
            </Field>
            <Field label="Initial Status">
              <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                {INITIAL_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Remarks">
                <textarea className={`${inputClass} min-h-[5rem]`} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any notes about this inquiry..." />
              </Field>
            </div>
          </div>

          {serverError && <Alert>{serverError}</Alert>}

          <FormActions onCancel={() => navigate('/admissions')} submitting={submitting} submitLabel="Create Admission" />
        </form>
      </Card>
    </AppShell>
  )
}
