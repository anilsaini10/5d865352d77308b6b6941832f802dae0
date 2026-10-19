import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Users2, Loader2 } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import Pagination from '../../components/Pagination.jsx'
import { ConfirmDialog, EmptyState } from '../../components/ui.jsx'
import ResetPasswordDialog from '../../components/ResetPasswordDialog.jsx'
import { fetchAdminsDirectory } from './adminsDirectory.api.js'
import { adminsApi } from './admins.api.js'
import { getErrorMessage } from '../../api/httpClient.js'
import { useToast } from '../../context/ToastContext.jsx'
import AdminFormModal from './components/AdminFormModal.jsx'
import AdminsTable from './components/AdminsTable.jsx'
import AdminCreatedBanner from './components/AdminCreatedBanner.jsx'

const PAGE_SIZE = 20

export default function AdminsListPage() {
  const { notify } = useToast()

  const [schools, setSchools] = useState([])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [adminModal, setAdminModal] = useState(null) // { admin? } — no admin means "create"
  const [justCreated, setJustCreated] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetchAdminsDirectory()
      .then((directory) => {
        if (cancelled) return
        setSchools(directory.schools)
        setAdmins(directory.admins)
      })
      .catch((err) => {
        if (cancelled) return
        setError(getErrorMessage(err, 'Could not load admins.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  useEffect(() => {
    setPage(1)
  }, [search, schoolFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return admins.filter((a) => {
      if (schoolFilter !== 'all' && a.schoolId !== schoolFilter) return false
      if (!q) return true
      return [a.name, a.email, a.phone, a.schoolName].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    })
  }, [admins, search, schoolFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const attachSchoolName = (admin) => ({
    ...admin,
    schoolName: schools.find((s) => s.id === admin.schoolId)?.name,
  })

  const handleAdminSaved = ({ admin, defaultPassword }, { isEdit }) => {
    const withSchool = attachSchoolName(admin)
    if (isEdit) {
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? withSchool : a)))
      notify(`${admin.name} was updated.`, 'success')
    } else {
      setAdmins((prev) => [withSchool, ...prev])
      setJustCreated({ admin: withSchool, defaultPassword })
    }
  }

  const reactivate = async (admin) => {
    try {
      const updated = await adminsApi.setStatus(admin.schoolId, admin.id, true)
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? attachSchoolName(updated) : a)))
      notify(`${admin.name} was reactivated.`, 'success')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not reactivate admin.'), 'error')
    }
  }

  const confirmDeactivate = async () => {
    const admin = deactivateTarget
    try {
      const updated = await adminsApi.setStatus(admin.schoolId, admin.id, false)
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? attachSchoolName(updated) : a)))
      notify(`${admin.name} was deactivated.`, 'success')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not deactivate admin.'), 'error')
    }
  }

  return (
    <AppShell
      title="Admins"
      subtitle="All admin accounts across every school"
      actions={
        <button
          onClick={() => setAdminModal({})}
          disabled={loading || schools.length === 0}
          className="flex items-center gap-1.5 bg-board hover:bg-board-light text-paper text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60 transition-colors"
        >
          <Plus size={16} /> New admin
        </button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or school..."
            className="w-full rounded-lg border border-line bg-surface pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-board focus:ring-2 focus:ring-board/15 outline-none transition-shadow"
          />
        </div>

        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          className="w-full sm:w-56 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-board focus:ring-2 focus:ring-board/15 outline-none transition-shadow"
        >
          <option value="all">All schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {justCreated && (
        <AdminCreatedBanner
          admin={justCreated.admin}
          defaultPassword={justCreated.defaultPassword}
          onDismiss={() => setJustCreated(null)}
        />
      )}

      <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink/40">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-coral font-medium">{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users2}
            title={admins.length === 0 ? 'No admins yet' : 'No matches'}
            message={admins.length === 0 ? 'Add an admin from a school page, or create one here.' : 'Try a different search term or school filter.'}
          />
        ) : (
          <AdminsTable
            admins={pageItems}
            showSchool
            onEdit={(admin) => setAdminModal({ admin })}
            onToggleStatus={(admin) => (admin.isActive ? setDeactivateTarget(admin) : reactivate(admin))}
            onResetPassword={(admin) => setResetTarget({ id: admin.id, name: admin.name, schoolId: admin.schoolId })}
          />
        )}
      </div>

      {!loading && !error && filtered.length > 0 && (
        <Pagination page={page} totalPages={totalPages} total={filtered.length} onChange={setPage} />
      )}

      <AdminFormModal
        open={!!adminModal}
        onClose={() => setAdminModal(null)}
        schools={schools}
        admin={adminModal?.admin}
        onSaved={handleAdminSaved}
      />

      <ResetPasswordDialog
        target={resetTarget}
        request={() => adminsApi.resetPassword(resetTarget.schoolId, resetTarget.id)}
        onClose={() => setResetTarget(null)}
        onStale={() => setReloadKey((k) => k + 1)}
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
