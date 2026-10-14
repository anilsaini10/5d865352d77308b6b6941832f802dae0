import { useState } from 'react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, Tabs } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { teachersApi } from '../teachers/teachers.api.js'
import AttendanceRegisterTab from './components/AttendanceRegisterTab.jsx'

const TABS = [
  { value: 'register', label: 'Daily register' },
  { value: 'history', label: 'History' },
]

export default function TeacherAttendancePage() {
  const [tab, setTab] = useState('register')
  const { data, error } = useFetch(() => teachersApi.listAll(), [], { errorMessage: 'Could not load teachers.' })
  const teachers = data ?? []

  return (
    <AppShell title="Teacher attendance" subtitle="Teachers’ self check-ins, admin marking and the final status">
      <div className="overflow-x-auto mb-5">
        <Tabs options={TABS} value={tab} onChange={setTab} />
      </div>
      {error && <Alert className="mb-4">{error}</Alert>}
      {tab === 'register' && <AttendanceRegisterTab mode="day" teachers={teachers} />}
      {tab === 'history' && <AttendanceRegisterTab mode="range" teachers={teachers} />}
    </AppShell>
  )
}
