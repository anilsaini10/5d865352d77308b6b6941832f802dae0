import { useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { schoolsApi } from '../schools.api.js'
import SchoolUsersTab from './SchoolUsersTab.jsx'

export default function SchoolUsersPage() {
  const { schoolId } = useParams()
  const navigate = useNavigate()

  const { data: school, loading, error } = useFetch(
    () => schoolsApi.getById(schoolId),
    [schoolId],
  )

  if (loading) {
    return (
      <AppShell title="School Users" subtitle=" " onBack={() => navigate(`/schools/${schoolId}`)}>
        <div className="flex items-center justify-center py-24 text-ink/40">
          <Loader2 size={22} className="animate-spin" />
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="School Users" onBack={() => navigate(`/schools/${schoolId}`)}>
        <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-4 py-3">{error}</p>
      </AppShell>
    )
  }

  return (
    <AppShell
      title={`${school?.name ?? 'School'} — Users`}
      subtitle="Students, teachers and staff in this school"
      onBack={() => navigate(`/schools/${schoolId}`)}
    >
      <SchoolUsersTab schoolId={schoolId} />
    </AppShell>
  )
}
