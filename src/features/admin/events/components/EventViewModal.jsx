import { Pencil, Trash2 } from 'lucide-react'
import { Modal, Badge, Button } from '../../../../components/ui.jsx'
import { formatDateTime } from '../../../../utils/format.js'
import { AUDIENCE_LABELS } from '../../constants.js'
import { eventTypeMeta, formatEventRange } from './eventUtils.js'

export default function EventViewModal({ event, onClose, onEdit, onDelete }) {
  if (!event) return null
  const type = eventTypeMeta(event.eventType)

  return (
    <Modal open={!!event} onClose={onClose} title={event.title} subtitle={formatEventRange(event)}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={type.tone}>{type.label}</Badge>
          <Badge tone="info">{AUDIENCE_LABELS[event.audience] ?? event.audience}</Badge>
        </div>

        {event.description ? (
          <p className="text-sm text-ink/75 leading-relaxed whitespace-pre-line break-words">{event.description}</p>
        ) : (
          <p className="text-sm text-ink/40 italic">No description.</p>
        )}

        <p className="text-xs text-ink/45">
          Added by <span className="font-medium text-ink/65">{event.createdBy?.name ?? '—'}</span>
          {event.createdAt && <> · {formatDateTime(event.createdAt)}</>}
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <Button variant="danger-ghost" icon={Trash2} onClick={onDelete}>Delete</Button>
          <Button icon={Pencil} onClick={onEdit}>Edit</Button>
        </div>
      </div>
    </Modal>
  )
}
