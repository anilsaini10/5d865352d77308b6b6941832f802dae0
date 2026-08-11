import { Link } from 'react-router-dom'
import { School, Users, UserCheck, ArrowUpRight, Plus, GraduationCap } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge } from '../components/ui.jsx'
import { useData } from '../context/DataContext.jsx'

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="stub-edge relative bg-white border border-line rounded-2xl shadow-card p-5 pl-6 overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-[0.07] ${accent}`} />
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-board/5 flex items-center justify-center">
          <Icon size={19} className="text-board" strokeWidth={2.2} />
        </div>
      </div>
      <p className="font-display text-3xl font-semibold text-ink mt-4">{value}</p>
      <p className="text-sm text-ink/60 font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs text-ink/40 mt-2">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { schools, admins } = useData()

  const activeSchools = schools.filter((s) => s.status === 'active').length
  const totalStudents = schools.reduce((sum, s) => sum + (Number(s.students) || 0), 0)
  const pendingAdmins = admins.filter((a) => a.status === 'invited').length

  const recentSchools = [...schools]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5)

  const schoolName = (id) => schools.find((s) => s.id === id)?.name || 'Unassigned'

  return (
    <AppShell
      title="Dashboard"
      subtitle="Sabhi schools aur admins ka ek nazar mein overview"
      actions={
        <Link
          to="/schools"
          className="flex items-center gap-1.5 bg-board hover:bg-board-light text-paper text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} /> New school
        </Link>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={School} label="Total schools" value={schools.length} sub={`${activeSchools} active`} accent="bg-board" />
        <StatCard icon={GraduationCap} label="Total students" value={totalStudents.toLocaleString('en-IN')} sub="across all schools" accent="bg-chalk" />
        <StatCard icon={Users} label="Total admins" value={admins.length} sub={`${admins.filter(a=>a.role==='Super Admin').length} super admins`} accent="bg-coral" />
        <StatCard icon={UserCheck} label="Pending invites" value={pendingAdmins} sub="awaiting first login" accent="bg-board" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mt-6">
        <div className="lg:col-span-3 bg-white border border-line rounded-2xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="font-display font-semibold text-ink">Recently added schools</h2>
            <Link to="/schools" className="text-xs font-semibold text-board hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-line">
            {recentSchools.length === 0 && (
              <p className="text-sm text-ink/50 px-5 py-8 text-center">Abhi tak koi school add nahi hui.</p>
            )}
            {recentSchools.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{s.name}</p>
                  <p className="text-xs text-ink/50 mt-0.5">{s.city}, {s.state} · {s.code}</p>
                </div>
                <Badge tone={s.status}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-line rounded-2xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h2 className="font-display font-semibold text-ink">Admins awaiting setup</h2>
            <Link to="/admins" className="text-xs font-semibold text-board hover:underline flex items-center gap-1">
              Manage <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-line">
            {admins.filter((a) => a.status === 'invited').length === 0 && (
              <p className="text-sm text-ink/50 px-5 py-8 text-center">Koi pending invite nahi hai.</p>
            )}
            {admins.filter((a) => a.status === 'invited').map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{a.name}</p>
                  <p className="text-xs text-ink/50 mt-0.5 truncate">{schoolName(a.schoolId)}</p>
                </div>
                <Badge tone="invited">invited</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
