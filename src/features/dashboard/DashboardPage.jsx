import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { School, Users, UserCheck, UserX, Plus, Loader2 } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import { fetchAdminsDirectory } from '../admins/adminsDirectory.api.js'
import { getErrorMessage } from '../../api/httpClient.js'

function StatTile({ icon: Icon, label, value, accent }) {
  const accents = {
    board: 'bg-board/10 text-board',
    coral: 'bg-coral/10 text-coral',
  }

  return (
    <div className="bg-white border border-line rounded-2xl shadow-card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accents[accent] || accents.board}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-ink/55">{label}</p>
        <p className="text-2xl font-semibold text-ink">{value.toLocaleString('en-IN')}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    fetchAdminsDirectory()
      .then(({ schools, admins }) => {
        if (cancelled) return
        const activeAdmins = admins.filter((a) => a.isActive).length
        setStats({
          totalSchools: schools.length,
          totalAdmins: admins.length,
          activeAdmins,
          inactiveAdmins: admins.length - activeAdmins,
        })
      })
      .catch((err) => {
        if (cancelled) return
        setError(getErrorMessage(err, 'Could not load dashboard data.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppShell
      title="Dashboard"
      subtitle="An overview of schools and admins in the system"
      actions={
        <button
          onClick={() => navigate('/schools/new')}
          className="flex items-center gap-1.5 bg-board hover:bg-board-light text-paper text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} /> New school
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-24 text-ink/40">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-4 py-3">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile icon={School} label="Total schools" value={stats.totalSchools} accent="board" />
          <StatTile icon={Users} label="Total admins" value={stats.totalAdmins} accent="board" />
          <StatTile icon={UserCheck} label="Active admins" value={stats.activeAdmins} accent="board" />
          <StatTile icon={UserX} label="Inactive admins" value={stats.inactiveAdmins} accent="coral" />
        </div>
      )}
    </AppShell>
  )
}
