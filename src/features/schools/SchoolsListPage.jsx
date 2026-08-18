import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, School as SchoolIcon, Loader2 } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import Pagination from '../../components/Pagination.jsx'
import { EmptyState } from '../../components/ui.jsx'
import { schoolsApi } from './schools.api.js'
import { BOARD_LABELS } from './schools.types.js'
import { getErrorMessage } from '../../api/httpClient.js'

const PAGE_SIZE = 20

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SchoolsListPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    schoolsApi
      .list({ page, pageSize: PAGE_SIZE, search })
      .then((data) => {
        if (cancelled) return
        setItems(data.items)
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
      })
      .catch((err) => {
        if (cancelled) return
        setError(getErrorMessage(err, 'Could not load schools.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, search])

  return (
    <AppShell
      title="Schools"
      subtitle="Register schools and manage their admins"
      actions={
        <button
          onClick={() => navigate('/schools/new')}
          className="flex items-center gap-1.5 bg-board hover:bg-board-light text-paper text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} /> New school
        </button>
      }
    >
      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or city..."
          className="w-full rounded-lg border border-line bg-white pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-board focus:ring-2 focus:ring-board/15 outline-none transition-shadow"
        />
      </div>

      <div className="bg-white border border-line rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink/40">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-coral font-medium">{error}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={SchoolIcon}
            title={total === 0 && !search ? 'No schools yet' : 'No matches'}
            message={total === 0 && !search ? 'Register your first school to get started.' : 'Try a different search term.'}
            action={
              total === 0 && !search && (
                <button
                  onClick={() => navigate('/schools/new')}
                  className="flex items-center gap-1.5 bg-board text-paper text-sm font-semibold px-4 py-2.5 rounded-lg"
                >
                  <Plus size={16} /> Add school
                </button>
              )
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/45">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Code</th>
                <th className="px-5 py-3 font-semibold">City</th>
                <th className="px-5 py-3 font-semibold">Board</th>
                <th className="px-5 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((school) => (
                <tr
                  key={school.id}
                  onClick={() => navigate(`/schools/${school.id}`)}
                  className="border-b border-line last:border-0 hover:bg-line/25 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5 font-semibold text-ink">{school.name}</td>
                  <td className="px-5 py-3.5 text-ink/55 font-mono text-xs">{school.code}</td>
                  <td className="px-5 py-3.5 text-ink/65">{school.city || '—'}</td>
                  <td className="px-5 py-3.5 text-ink/65">{school.board ? BOARD_LABELS[school.board] || school.board : '—'}</td>
                  <td className="px-5 py-3.5 text-ink/55">{formatDate(school.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && items.length > 0 && (
        <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      )}
    </AppShell>
  )
}
