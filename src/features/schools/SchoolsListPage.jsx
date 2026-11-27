import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, School as SchoolIcon } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import Pagination from '../../components/Pagination.jsx'
import { AsyncContent, EmptyState, SearchInput } from '../../components/ui.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { schoolsApi } from './schools.api.js'
import { BOARD_LABELS } from './schools.types.js'

const PAGE_SIZE = 20

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SchoolsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search)

  const { data, loading, error } = useFetch(
    () => schoolsApi.list({ page, pageSize: PAGE_SIZE, search: debouncedSearch }),
    [page, debouncedSearch],
    { errorMessage: 'Could not load schools.' },
  )

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  const changeSearch = (v) => {
    setSearch(v)
    setPage(1)
  }

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
      <div className="mb-5 max-w-sm">
        <SearchInput value={search} onChange={changeSearch} placeholder="Search by name or city..." />
      </div>

      <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
        <AsyncContent
          loading={loading}
          error={error}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={SchoolIcon}
              title={total === 0 && !debouncedSearch ? 'No schools yet' : 'No matches'}
              message={total === 0 && !debouncedSearch ? 'Register your first school to get started.' : 'Try a different search term.'}
              action={
                total === 0 && !debouncedSearch && (
                  <button
                    onClick={() => navigate('/schools/new')}
                    className="flex items-center gap-1.5 bg-board text-paper text-sm font-semibold px-4 py-2.5 rounded-lg"
                  >
                    <Plus size={16} /> Add school
                  </button>
                )
              }
            />
          }
        >
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
        </AsyncContent>
      </div>

      {!loading && !error && items.length > 0 && (
        <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      )}
    </AppShell>
  )
}
