import { useState } from 'react'
import { Plus } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Button, ConfirmDialog, Tabs } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { eventsApi } from './events.api.js'
import EventsCalendar from './components/EventsCalendar.jsx'
import EventsList from './components/EventsList.jsx'
import EventFormModal from './components/EventFormModal.jsx'
import EventViewModal from './components/EventViewModal.jsx'

const VIEWS = [
  { value: 'calendar', label: 'Calendar' },
  { value: 'list', label: 'List' },
]

export default function EventsPage() {
  const { notify } = useToast()
  const [view, setView] = useState('calendar')
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewing, setViewing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [defaultDate, setDefaultDate] = useState('')
  const [deleting, setDeleting] = useState(null)

  const refresh = () => setRefreshKey((k) => k + 1)

  const openCreate = (date = '') => {
    setEditing(null)
    setDefaultDate(date)
    setFormOpen(true)
  }
  const openEdit = (ev) => {
    setViewing(null)
    setEditing(ev)
    setFormOpen(true)
  }
  const openDelete = (ev) => {
    setViewing(null)
    setDeleting(ev)
  }

  const onSaved = (_saved, { isEdit }) => {
    notify(isEdit ? 'Event updated.' : 'Event created.', 'success')
    refresh()
  }

  const confirmDelete = async () => {
    try {
      await eventsApi.remove(deleting.id)
      notify('Event deleted.', 'success')
      refresh()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete event.'), 'error')
    }
  }

  return (
    <AppShell
      title="Events"
      subtitle="School calendar"
      actions={
        <Button icon={Plus} onClick={() => openCreate()}>
          <span className="hidden sm:inline">New event</span>
          <span className="sm:hidden">New</span>
        </Button>
      }
    >
      <Tabs options={VIEWS} value={view} onChange={setView} className="mb-5" />

      {view === 'calendar' ? (
        <EventsCalendar refreshKey={refreshKey} onOpenEvent={setViewing} onCreateOnDay={openCreate} />
      ) : (
        <EventsList refreshKey={refreshKey} onOpenEvent={setViewing} onEdit={openEdit} onDelete={openDelete} />
      )}

      <EventViewModal event={viewing} onClose={() => setViewing(null)} onEdit={() => openEdit(viewing)} onDelete={() => openDelete(viewing)} />

      <EventFormModal open={formOpen} onClose={() => setFormOpen(false)} event={editing} defaultDate={defaultDate} onSaved={onSaved} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete event?"
        message={
          <>
            <strong className="text-ink">{deleting?.title}</strong> will be deleted and removed from the school calendar.
          </>
        }
      />
    </AppShell>
  )
}
