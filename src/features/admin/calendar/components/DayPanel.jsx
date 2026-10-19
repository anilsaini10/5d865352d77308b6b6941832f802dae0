import { Plus } from 'lucide-react'
import { Badge, Button, Card } from '../../../../components/ui.jsx'
import { eventTypeMeta, formatEventRange } from '../../events/components/eventUtils.js'
import { formatPaperDate } from '../../exams/components/scheduleUtils.js'
import EntryActions from './EntryActions.jsx'

/** Entries on the selected day, with a shortcut to add one on that date. */
export default function DayPanel({ day, entries, onAdd, onEdit, onDelete }) {
  if (!day) return null
  return (
    <Card className="p-5 mt-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-display text-base font-semibold text-ink">{formatPaperDate(day, { weekday: true })}</h3>
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => onAdd(day)}>Add entry</Button>
      </div>
      {entries?.length ? (
        <ul className="divide-y divide-line">
          {entries.map((e) => {
            const meta = eventTypeMeta(e.type)
            return (
              <li key={`${e.source}-${e.id}`} className="py-2.5 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{e.title}</p>
                  <p className="text-xs text-ink/50">{formatEventRange(e)}{e.schoolClosed ? ' · School closed' : ''}{e.classes?.length ? ` · ${e.classes.join(', ')}` : ''}</p>
                  {e.description && <p className="text-xs text-ink/60 mt-0.5">{e.description}</p>}
                </div>
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <EntryActions entry={e} onEdit={onEdit} onDelete={onDelete} />
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink/55">Nothing planned for this day.</p>
      )}
    </Card>
  )
}
