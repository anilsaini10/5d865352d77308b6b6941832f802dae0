import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { IconButton } from '../../../../components/ui.jsx'

/** Edit/Delete for EVENT entries; EXAM entries are managed in the Exams module. */
export default function EntryActions({ entry, onEdit, onDelete }) {
  if (entry.source === 'EXAM') {
    return <Link to="/exams" className="text-xs font-semibold text-board hover:underline whitespace-nowrap">Managed in Exams</Link>
  }
  return (
    <div className="inline-flex">
      <IconButton icon={Pencil} label={`Edit ${entry.title}`} tone="primary" onClick={() => onEdit(entry)} />
      <IconButton icon={Trash2} label={`Delete ${entry.title}`} tone="danger" onClick={() => onDelete(entry)} />
    </div>
  )
}
