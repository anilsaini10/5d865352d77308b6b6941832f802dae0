import { Check, X } from 'lucide-react'
import { Badge, Button } from '../../../../components/ui.jsx'
import { formatDateRange, formatDateTime } from '../../../../utils/format.js'
import { LEAVE_STATUSES, enumMeta } from '../../constants.js'
import { leaveDays } from '../leave.utils.js'

const personName = (p) => (p && typeof p === 'object' ? p.name : p)

export default function LeaveCard({ leave, title, subtitle, onReview }) {
  const meta = enumMeta(LEAVE_STATUSES, leave.status)
  const days = leaveDays(leave.fromDate, leave.toDate)
  const pending = leave.status === 'PENDING'
  const reviewer = personName(leave.reviewedBy)

  return (
    <li className="px-5 py-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{title}</p>
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
          {subtitle && <p className="text-xs text-ink/50 mt-0.5">{subtitle}</p>}
          <p className="text-sm text-ink mt-2">
            <span className="font-semibold">{formatDateRange(leave.fromDate, leave.toDate)}</span>
            <span className="text-ink/50"> · {days} day{days === 1 ? '' : 's'}</span>
          </p>
          {leave.reason && <p className="text-sm text-ink/70 mt-1 whitespace-pre-line break-words">{leave.reason}</p>}
          <p className="text-xs text-ink/40 mt-2">Applied {formatDateTime(leave.createdAt)}</p>

          {!pending && (reviewer || leave.reviewedAt || leave.reviewRemarks) && (
            <div className="mt-3 text-sm bg-line/20 border border-line rounded-lg px-3 py-2">
              <p className="text-xs text-ink/55">
                {meta.label} {reviewer && <>by <span className="font-semibold text-ink/75">{reviewer}</span></>}
                {leave.reviewedAt && <> · {formatDateTime(leave.reviewedAt)}</>}
              </p>
              {leave.reviewRemarks && <p className="text-ink/75 mt-1 break-words">{leave.reviewRemarks}</p>}
            </div>
          )}
        </div>

        {pending && (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" icon={Check} onClick={() => onReview('APPROVED')}>Approve</Button>
            <Button size="sm" variant="danger-ghost" icon={X} onClick={() => onReview('REJECTED')}>Reject</Button>
          </div>
        )}
      </div>
    </li>
  )
}
