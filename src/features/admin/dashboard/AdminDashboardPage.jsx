import { useNavigate } from 'react-router-dom'
import { GraduationCap, UserSquare2, BriefcaseBusiness, Layers, Plus } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, Button, PageLoader } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { formatNumber } from '../../../utils/format.js'
import { adminDashboardApi } from './dashboard.api.js'

function StatTile({ icon: Icon, label, value, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-surface border border-line rounded-2xl shadow-card p-5 flex items-center gap-4 hover:border-board/30 hover:shadow-pop transition-shadow"
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-board/10 text-board">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-ink/55">{label}</p>
        <p className="text-2xl font-semibold text-ink">{formatNumber(value)}</p>
        {hint && <p className="text-xs text-ink/40 mt-0.5">{hint}</p>}
      </div>
    </button>
  )
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: stats, loading, error } = useFetch(() => adminDashboardApi.get(), [], {
    errorMessage: 'Could not load dashboard data.',
  })

  return (
    <AppShell
      title="Dashboard"
      subtitle={user?.schoolName ? `Overview of ${user.schoolName}` : 'School overview'}
      actions={
        <Button icon={Plus} onClick={() => navigate('/students')} className="hidden sm:inline-flex">
          Add student
        </Button>
      }
    >
      {loading ? (
        <PageLoader className="py-24" />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile icon={GraduationCap} label="Students" value={stats.studentsCount} hint="Active only" onClick={() => navigate('/students')} />
          <StatTile icon={UserSquare2} label="Teachers" value={stats.teachersCount} hint="Active only" onClick={() => navigate('/teachers')} />
          <StatTile icon={BriefcaseBusiness} label="Staff" value={stats.staffCount} hint="Active only" onClick={() => navigate('/staff')} />
          <StatTile icon={Layers} label="Classes" value={stats.classesCount} onClick={() => navigate('/classes')} />
        </div>
      )}
    </AppShell>
  )
}
