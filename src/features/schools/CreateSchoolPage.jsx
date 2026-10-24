import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import { Section, Field, inputClass } from '../../components/ui.jsx'
import SchoolFieldSections from './components/SchoolFieldSections.jsx'
import { schoolsApi } from './schools.api.js'
import { buildSchoolPayload, toSchoolFormValues } from './schools.validation.js'
import { validateAdminForm } from '../admins/admins.validation.js'
import { getErrorMessage } from '../../api/httpClient.js'
import { useToast } from '../../context/ToastContext.jsx'

const emptyAdmin = { name: '', email: '', phone: '', username: '' }

export default function CreateSchoolPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const form = useForm({ defaultValues: toSchoolFormValues(null) })

  const [addAdminNow, setAddAdminNow] = useState(false)
  const [adminForm, setAdminForm] = useState(emptyAdmin)
  const [adminErrors, setAdminErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setAdminField = (key) => (e) => setAdminForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = async (values) => {
    setServerError('')

    let adminPayload
    if (addAdminNow) {
      const validationErrors = validateAdminForm(adminForm)
      setAdminErrors(validationErrors)
      if (Object.keys(validationErrors).length > 0) return
      adminPayload = {
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        phone: adminForm.phone.trim() || undefined,
        username: adminForm.username.trim().toLowerCase() || undefined,
      }
    }

    const payload = buildSchoolPayload(values)
    if (adminPayload) payload.admin = adminPayload

    setSubmitting(true)
    try {
      const result = await schoolsApi.create(payload)
      notify(`${result.school.name} was created.`, 'success')
      navigate(`/schools/${result.school.id}`, {
        replace: true,
        state: result.admin
          ? { justCreatedAdmin: { admin: result.admin, defaultPassword: result.defaultPassword } }
          : undefined,
      })
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not create school.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell
      title="New school"
      subtitle="Register a school in the system"
      onBack={() => navigate('/schools')}
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl">
          <SchoolFieldSections mode="create" />

          <Section
            title="Add first admin now?"
            description="Optional — you can also add admins later from the school page."
            defaultOpen={false}
          >
            <label className="sm:col-span-2 flex items-center gap-2 text-sm font-semibold text-ink/80">
              <input
                type="checkbox"
                checked={addAdminNow}
                onChange={(e) => setAddAdminNow(e.target.checked)}
                className="rounded border-line"
              />
              Create the first admin account along with this school
            </label>

            {addAdminNow && (
              <>
                <Field label="Admin name" required error={adminErrors.name}>
                  <input className={inputClass} value={adminForm.name} onChange={setAdminField('name')} placeholder="Meera Kapoor" />
                </Field>
                <Field label="Admin email" required error={adminErrors.email}>
                  <input
                    type="email"
                    className={inputClass}
                    value={adminForm.email}
                    onChange={setAdminField('email')}
                    placeholder="meera@school.edu"
                  />
                </Field>
                <Field label="Admin username" error={adminErrors.username} hint="Optional · Saved in lowercase">
                  <input
                    className={inputClass}
                    value={adminForm.username}
                    onChange={setAdminField('username')}
                    onBlur={() => setAdminForm((f) => ({ ...f, username: f.username.trim().toLowerCase() }))}
                    placeholder="meera.kapoor"
                  />
                </Field>
                <Field label="Admin phone" error={adminErrors.phone} hint="Optional, 10-15 digits">
                  <input className={inputClass} value={adminForm.phone} onChange={setAdminField('phone')} placeholder="9876543210" />
                </Field>
              </>
            )}
          </Section>

          {serverError && (
            <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-3 py-2 mb-4">
              {serverError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/schools')}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink/70 hover:bg-line/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold bg-board hover:bg-board-light disabled:opacity-60 text-paper transition-colors"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Create school
            </button>
          </div>
        </form>
      </FormProvider>
    </AppShell>
  )
}
