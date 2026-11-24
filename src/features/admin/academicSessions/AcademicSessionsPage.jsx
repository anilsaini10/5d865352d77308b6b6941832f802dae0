import { useState } from 'react'
import { Plus, CalendarRange, Pencil, Trash2 } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import {
  AsyncContent, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton,
  Table, THead, Th, Tr, Td,
} from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { formatDay } from '../../../utils/format.js'
import { useAcademicSessions } from './useAcademicSessions.js'
import { academicSessionsApi } from './academicSessions.api.js'
import SessionFormModal from './SessionFormModal.jsx'

export default function AcademicSessionsPage() {
  const { notify } = useToast()
  const { sessions, loading, error, reload } = useAcademicSessions()

  const [formModal, setFormModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const confirmDelete = async () => {
    try {
      await academicSessionsApi.remove(deleteTarget.id)
      notify('Session deleted.', 'success')
      reload()
    } catch (err) {
      notify(getErrorMessage(err, 'Could not delete session.'), 'error')
    }
  }

  return (
    <AppShell
      title="Academic Sessions"
      subtitle="Manage academic years for promotions and admissions"
      actions={<Button icon={Plus} onClick={() => setFormModal({})}>Add Session</Button>}
    >
      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading}
          error={error}
          empty={sessions.length === 0}
          emptyState={
            <EmptyState
              icon={CalendarRange}
              title="No academic sessions"
              message="Create your first academic session to start using promotions and admissions."
              action={<Button icon={Plus} onClick={() => setFormModal({})}>Add Session</Button>}
            />
          }
        >
          <Table>
            <THead>
              <Th>Session Name</Th>
              <Th>Start Date</Th>
              <Th>End Date</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {sessions.map((s) => (
                <Tr key={s.id} className="hover:bg-line/20">
                  <Td>
                    <span className="font-semibold text-ink">{s.name}</span>
                  </Td>
                  <Td>{formatDay(s.startDate)}</Td>
                  <Td>{formatDay(s.endDate)}</Td>
                  <Td>
                    {s.isCurrent ? (
                      <Badge tone="success">Current</Badge>
                    ) : (
                      <Badge tone="neutral">Inactive</Badge>
                    )}
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <IconButton icon={Pencil} label={`Edit ${s.name}`} tone="primary" onClick={() => setFormModal({ session: s })} />
                    <IconButton icon={Trash2} label={`Delete ${s.name}`} tone="danger" onClick={() => setDeleteTarget(s)} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>

      <SessionFormModal
        open={!!formModal}
        onClose={() => setFormModal(null)}
        session={formModal?.session}
        onSaved={reload}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete this session?"
        confirmLabel="Delete session"
        message={
          <p>
            <span className="font-semibold text-ink">{deleteTarget?.name}</span> will be permanently deleted.
            This is only possible if no data is linked to this session.
          </p>
        }
      />
    </AppShell>
  )
}
