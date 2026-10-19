import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppShell from '../../../components/AppShell.jsx'
import { Tabs } from '../../../components/ui.jsx'
import FindFreeTeacherTab from './FindFreeTeacherTab.jsx'
import FreeSlotsTab from './FreeSlotsTab.jsx'

const TABS = [
  { value: 'find', label: 'Find a free teacher' },
  { value: 'slots', label: 'Free slots' },
]

/**
 * Open with ?date=YYYY-MM-DD (or ?day=MONDAY) &start=HH:MM &end=HH:MM to pre-fill the search,
 * e.g. from a timetable period or an exam paper ("Find substitute").
 */
export default function TeacherAvailabilityPage() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState('find')
  const initial = { date: params.get('date') || '', day: (params.get('day') || '').toUpperCase(), start: params.get('start') || '', end: params.get('end') || '' }

  return (
    <AppShell title="Teacher availability" subtitle="Find who is free in a time slot, and see everyone’s free time">
      <div className="overflow-x-auto mb-5"><Tabs options={TABS} value={tab} onChange={setTab} /></div>
      {tab === 'find' ? <FindFreeTeacherTab initial={initial} /> : <FreeSlotsTab />}
    </AppShell>
  )
}
