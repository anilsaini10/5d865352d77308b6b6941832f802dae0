import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import { EmptyState, ConfirmDialog } from '../../components/ui.jsx'
import { schoolsApi } from './schools.api.js'
import { adminsApi } from '../admins/admins.api.js'
import { buildSchoolPayload, toSchoolFormValues } from './schools.validation.js'
import { getErrorCode, getErrorMessage } from '../../api/httpClient.js'
import { useToast } from '../../context/ToastContext.jsx'
import SchoolFieldSections from './components/SchoolFieldSections.jsx'
import AdminFormModal from '../admins/components/AdminFormModal.jsx'
import AdminsTable from '../admins/components/AdminsTable.jsx'
import AdminCreatedBanner from '../admins/components/AdminCreatedBanner.jsx'

export default function SchoolDetailPage() {
  const { schoolId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { notify } = useToast()

  const [school, setSchool] = useState(null)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)

  const [adminModal, setAdminModal] = useState(null) // { admin? } — no admin means "create"
  const [justCreated, setJustCreated] = useState(location.state?.justCreatedAdmin || null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)

  const form = useForm({ defaultValues: toSchoolFormValues(null) })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setNotFound(false)

    Promise.all([schoolsApi.getById(schoolId), adminsApi.list(schoolId)])
      .then(([schoolData, adminsData]) => {
        if (cancelled) return
        setSchool(schoolData)
        setAdmins(adminsData)
        form.reset(toSchoolFormValues(schoolData))
      })
      .catch((err) => {
        if (cancelled) return
        if (getErrorCode(err) === 'SCHOOL_NOT_FOUND') {
          setNotFound(true)
        } else {
          setError(getErrorMessage(err, 'Could not load this school.'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId])

  const onSubmit = async (values) => {
    setServerError('')
    const payload = buildSchoolPayload(values)
    if (Object.keys(payload).length === 0) return

    setSaving(true)
    try {
      const updated = await schoolsApi.update(schoolId, payload)
      setSchool(updated)
      form.reset(toSchoolFormValues(updated))
      notify('School details updated.', 'success')
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not update school.'))
    } finally {
      setSaving(false)
    }
  }

  const handleAdminSaved = ({ admin, defaultPassword }, { isEdit }) => {
    if (isEdit) {
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? admin : a)))
      notify(`${admin.name} was updated.`, 'success')
    } else {
      setAdmins((prev) => [admin, ...prev])
      setJustCreated({ admin, defaultPassword })
    }
  }

  const reactivate = async (admin) => {
    try {
      const updated = await adminsApi.setStatus(schoolId, admin.id, true)
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? updated : a)))
      notify(`${admin.name} was reactivated.`, 'success')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not reactivate admin.'), 'error')
    }
  }

  const confirmDeactivate = async () => {
    const admin = deactivateTarget
    try {
      const updated = await adminsApi.setStatus(schoolId, admin.id, false)
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? updated : a)))
      notify(`${admin.name} was deactivated.`, 'success')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not deactivate admin.'), 'error')
    }
  }

  if (loading) {
    return (
      <AppShell title="School" subtitle=" " onBack={() => navigate('/schools')}>
        <div className="flex items-center justify-center py-24 text-ink/40">
          <Loader2 size={22} className="animate-spin" />
        </div>
      </AppShell>
    )
  }

  if (notFound) {
    return (
      <AppShell title="School not found" onBack={() => navigate('/schools')}>
        <div className="bg-surface border border-line rounded-2xl shadow-card">
          <EmptyState
            title="This school doesn't exist"
            message="It may have been removed, or the link is incorrect."
            action={
              <button
                onClick={() => navigate('/schools')}
                className="flex items-center gap-1.5 bg-board text-paper text-sm font-semibold px-4 py-2.5 rounded-lg"
              >
                <ArrowLeft size={16} /> Back to schools
              </button>
            }
          />
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="School" onBack={() => navigate('/schools')}>
        <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-4 py-3">{error}</p>
      </AppShell>
    )
  }

  return (
    <AppShell
      title={school.name}
      subtitle={`Code ${school.code} · School details and admin accounts`}
      onBack={() => navigate('/schools')}
    >
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl mb-8">
          <SchoolFieldSections mode="edit" code={school.code} />

          {serverError && (
            <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-3 py-2 mb-4">
              {serverError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold bg-board hover:bg-board-light disabled:opacity-60 text-paper transition-colors"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Save changes
            </button>
          </div>
        </form>
      </FormProvider>

      {justCreated && (
        <AdminCreatedBanner
          admin={justCreated.admin}
          defaultPassword={justCreated.defaultPassword}
          onDismiss={() => setJustCreated(null)}
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">Admins</h2>
        <button
          onClick={() => setAdminModal({})}
          className="flex items-center gap-1.5 bg-board hover:bg-board-light text-paper text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <UserPlus size={16} /> Add admin
        </button>
      </div>

      <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
        <AdminsTable
          admins={admins}
          onEdit={(admin) => setAdminModal({ admin })}
          onToggleStatus={(admin) => (admin.isActive ? setDeactivateTarget(admin) : reactivate(admin))}
        />
      </div>

      <AdminFormModal
        open={!!adminModal}
        onClose={() => setAdminModal(null)}
        schoolId={schoolId}
        admin={adminModal?.admin}
        onSaved={handleAdminSaved}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={confirmDeactivate}
        title="Deactivate this admin?"
        message={`"${deactivateTarget?.name}" will be signed out immediately and won't be able to log in until reactivated. This doesn't delete their account.`}
        confirmLabel="Deactivate"
      />
    </AppShell>
  )
}
