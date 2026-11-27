import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import Pagination from '../../../components/Pagination.jsx'
import { AsyncContent, Card, EmptyState, SearchInput, StatusFilter, Tabs } from '../../../components/ui.jsx'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js'
import { useFetch } from '../../../hooks/useFetch.js'
import { fetchSchoolUsers } from './schoolUsers.api.js'
import StudentsTable from './StudentsTable.jsx'
import TeachersTable from './TeachersTable.jsx'
import StaffTable from './StaffTable.jsx'

const TYPE_TABS = [
  { value: 'students', label: 'Students' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'staff', label: 'Staff' },
]

const PAGE_SIZE = 20

export default function SchoolUsersTab({ schoolId }) {
  const [type, setType] = useState('students')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => { setPage(1) }, [type, debouncedSearch, status])

  const {
    data: result,
    loading: usersLoading,
    error: usersError,
  } = useFetch(
    () =>
      fetchSchoolUsers(schoolId, {
        type,
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: status === 'ALL' ? undefined : status,
      }),
    [schoolId, type, page, debouncedSearch, status],
  )

  const items = result?.items ?? []
  const total = result?.total ?? 0
  const totalPages = result?.totalPages ?? 1

  const handleTypeChange = (v) => {
    setType(v)
    setSearch('')
    setStatus('ALL')
  }

  return (
    <>
      <div className="mb-5">
        <Tabs options={TYPE_TABS} value={type} onChange={handleTypeChange} />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={`Search ${type}...`}
        />
        <StatusFilter value={status} onChange={setStatus} inactiveLabel="Inactive" />
      </div>

      <Card className="overflow-hidden">
        <AsyncContent
          loading={usersLoading}
          error={usersError}
          empty={items.length === 0}
          emptyState={
            <EmptyState
              icon={GraduationCap}
              title={debouncedSearch || status !== 'ALL' ? 'No matches' : `No ${type} found`}
              message={
                debouncedSearch || status !== 'ALL'
                  ? 'Try a different search term or filter.'
                  : `This school has no ${type} yet.`
              }
            />
          }
        >
          {type === 'students' && <StudentsTable items={items} />}
          {type === 'teachers' && <TeachersTable items={items} />}
          {type === 'staff' && <StaffTable items={items} />}
        </AsyncContent>
      </Card>

      {!usersLoading && !usersError && items.length > 0 && (
        <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      )}
    </>
  )
}
