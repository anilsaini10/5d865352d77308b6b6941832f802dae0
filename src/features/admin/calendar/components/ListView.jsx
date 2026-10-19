import { Check } from 'lucide-react'
import { Badge, Card, Table, THead, Th, Tr, Td } from '../../../../components/ui.jsx'
import { AUDIENCE_LABELS } from '../../constants.js'
import { eventTypeMeta, formatEventRange } from '../../events/components/eventUtils.js'
import EntryActions from './EntryActions.jsx'

/** Entries grouped by month. A range spanning months appears under each month it touches. */
export default function ListView({ months, onEdit, onDelete }) {
  const filled = months.filter((m) => m.entries.length > 0)
  if (filled.length === 0) return <Card className="p-8 text-center text-sm text-ink/55">Nothing on the calendar for this period.</Card>
  return (
    <div className="space-y-5">
      {filled.map((m) => (
        <Card key={m.month} className="overflow-hidden">
          <h3 className="font-display text-base font-semibold text-ink px-5 pt-4 pb-1">{m.label}</h3>
          <Table>
            <THead><Th>Date</Th><Th>Title</Th><Th>Type</Th><Th>Audience</Th><Th>Days</Th><Th>School closed</Th><Th className="text-right">Actions</Th></THead>
            <tbody>
              {m.entries.map((e) => {
                const meta = eventTypeMeta(e.type)
                return (
                  <Tr key={`${e.source}-${e.id}`}>
                    <Td className="whitespace-nowrap">{formatEventRange(e)}</Td>
                    <Td className="min-w-[180px]">
                      <p className="font-semibold text-ink">{e.title}</p>
                      {e.classes?.length > 0 && <p className="text-xs text-ink/45">{e.classes.join(', ')}</p>}
                    </Td>
                    <Td><Badge tone={meta.tone}>{meta.label}</Badge></Td>
                    <Td className="whitespace-nowrap">{AUDIENCE_LABELS[e.audience] ?? e.audience}</Td>
                    <Td>{e.days}</Td>
                    <Td>{e.schoolClosed ? <Check size={16} className="text-coral" aria-label="School closed" /> : <span className="text-ink/30">—</span>}</Td>
                    <Td className="text-right"><EntryActions entry={e} onEdit={onEdit} onDelete={onDelete} /></Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </Card>
      ))}
    </div>
  )
}
