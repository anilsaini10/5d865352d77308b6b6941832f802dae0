import { useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { Badge, Button } from '../../../../components/ui.jsx'
import { eventTypeMeta, formatEventRange } from '../../events/components/eventUtils.js'
import { formatPaperDate } from '../../exams/components/scheduleUtils.js'
import EntryActions from './EntryActions.jsx'

/** Floating popup showing entries on the selected day, with a shortcut to add one. */
export default function DayPanel({ day, entries, onAdd, onEdit, onDelete, onClose }) {
  useEffect(() => {
    if (!day) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [day, onClose])

  if (!day) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${day}`}
        className="relative bg-paper rounded-2xl shadow-pop border border-line w-full max-w-md max-h-[70vh] overflow-y-auto animate-rise"
      >
        <div className="sticky top-0 bg-paper/95 backdrop-blur border-b border-line px-5 py-3.5 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="font-display text-base font-semibold text-ink">{formatPaperDate(day, { weekday: true })}</h3>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => onAdd(day)}>Add</Button>
            <button
              onClick={onClose}
              className="text-ink/50 hover:text-ink hover:bg-line/40 rounded-full p-1.5 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          {entries?.length ? (
            <ul className="divide-y divide-line">
              {entries.map((e) => {
                const meta = eventTypeMeta(e.type)
                return (
                  <li key={`${e.source}-${e.id}`} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink text-sm">{e.title}</p>
                        <p className="text-xs text-ink/50 mt-0.5">
                          {formatEventRange(e)}
                          {e.schoolClosed ? ' · School closed' : ''}
                          {e.classes?.length ? ` · ${e.classes.join(', ')}` : ''}
                        </p>
                        {e.description && <p className="text-xs text-ink/60 mt-1 leading-relaxed">{e.description}</p>}
                      </div>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <div className="flex justify-end mt-1">
                      <EntryActions entry={e} onEdit={onEdit} onDelete={onDelete} />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-ink/55 text-center py-4">Nothing planned for this day.</p>
          )}
        </div>
      </div>
    </div>
  )
}
