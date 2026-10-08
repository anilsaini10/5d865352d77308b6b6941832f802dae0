import { useState } from 'react'
import AppShell from '../../../components/AppShell.jsx'
import { Tabs } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { teachersApi } from '../teachers/teachers.api.js'
import MarkAttendanceTab from './components/MarkAttendanceTab.jsx'
import AttendanceHistoryTab from './components/AttendanceHistoryTab.jsx'

const TABS = [
  { value: 'mark', label: 'Mark attendance' },
  { value: 'history', label: 'History' },
]

export default function TeacherAttendancePage() {
  const [tab, setTab] = useState('mark')
  const { data, loading, error } = useFetch(() => teachersApi.listAll(), [], { errorMessage: 'Could not load teachers.' })
  const teachers = data ?? []

  return (
    <AppShell title="Teacher attendance" subtitle="Mark daily attendance and review past records">
      <div className="overflow-x-auto mb-5">
        <Tabs options={TABS} value={tab} onChange={setTab} />
      </div>
      {tab === 'mark' ? (
        <MarkAttendanceTab teachers={teachers} teachersLoading={loading} teachersError={error} />
      ) : (
        <AttendanceHistoryTab teachers={teachers} />
      )}
    </AppShell>
  )
}
