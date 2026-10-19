import { Link } from 'react-router-dom'
import { Clock, DoorOpen, Pencil, Trash2, UserRound, UserSearch, Coffee } from 'lucide-react'
import { IconButton } from '../../../../components/ui.jsx'
import { formatTime } from '../../../../utils/format.js'
import { SCHEDULE_TYPES } from '../../constants.js'

export default function ScheduleEntryCard({ entry, onEdit, onDelete }) {
  const isBreak = entry.type === SCHEDULE_TYPES.BREAK
  const timeRange = `${formatTime(entry.startTime?.slice(0, 5))} – ${formatTime(entry.endTime?.slice(0, 5))}`

  return (
    <div
      className={`group rounded-xl border p-3 text-sm transition-colors ${
        isBreak ? 'bg-chalk/15 border-chalk/40 text-chalk-ink' : 'bg-surface border-line hover:border-board/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[11px] font-bold uppercase tracking-wide ${isBreak ? 'text-chalk-ink/80' : 'text-board'}`}>
          {isBreak ? (
            <span className="inline-flex items-center gap-1"><Coffee size={12} /> Break</span>
          ) : entry.periodNo != null ? (
            `Period ${entry.periodNo}`
          ) : (
            'Period'
          )}
        </p>
        <div className="flex -mr-1.5 -mt-1.5 shrink-0">
          {!isBreak && entry.day && entry.startTime && (
            <Link
              to={`/teacher-availability?day=${entry.day}&start=${entry.startTime.slice(0, 5)}&end=${entry.endTime.slice(0, 5)}`}
              title="Find a substitute teacher for this slot"
              aria-label="Find substitute"
              className="rounded-lg p-1.5 text-ink/40 hover:text-board hover:bg-board/10 transition-colors"
            >
              <UserSearch size={15} />
            </Link>
          )}
          <IconButton icon={Pencil} label="Edit entry" tone="primary" onClick={() => onEdit(entry)} />
          <IconButton icon={Trash2} label="Delete entry" tone="danger" onClick={() => onDelete(entry)} />
        </div>
      </div>

      <p className={`font-semibold leading-snug break-words ${isBreak ? '' : 'text-ink'}`}>
        {isBreak ? entry.title || 'Break' : entry.subjectName || 'Subject'}
      </p>

      <div className={`mt-1.5 space-y-1 text-xs ${isBreak ? 'text-chalk-ink/80' : 'text-ink/60'}`}>
        <p className="flex items-center gap-1.5"><Clock size={12} className="shrink-0" /> {timeRange}</p>
        {!isBreak && entry.teacherName && (
          <p className="flex items-center gap-1.5 min-w-0"><UserRound size={12} className="shrink-0" /> <span className="truncate">{entry.teacherName}</span></p>
        )}
        {entry.roomNo && (
          <p className="flex items-center gap-1.5"><DoorOpen size={12} className="shrink-0" /> Room {entry.roomNo}</p>
        )}
      </div>
    </div>
  )
}
