import { Check } from 'lucide-react'
import { Badge, Button } from '../../../../components/ui.jsx'
import { formatDateTime } from '../../../../utils/format.js'
import { ROLE_LABELS, emailsMatch, formatPhone, phonesMatch, statusMeta } from '../recovery.constants.js'

export const StatusChip = ({ status }) => <Badge tone={statusMeta(status).tone}>{statusMeta(status).label}</Badge>

export const RoleChip = ({ role }) => <Badge tone={role === 'TEACHER' ? 'info' : 'primary'}>{ROLE_LABELS[role] ?? role}</Badge>

function Matched({ matched, children }) {
  return (
    <span className={`inline-flex items-center gap-1 ${matched ? 'text-success font-semibold' : ''}`}>
      {children}
      {matched && <Check size={13} strokeWidth={3} aria-label="Matches the account" />}
    </span>
  )
}

/** Submitted email + phones; values that match the account's are ticked green. */
export function ContactList({ submitted, account }) {
  const phones = submitted?.phones ?? []
  if (!submitted?.email && phones.length === 0) return <span className="text-ink/40">—</span>
  return (
    <ul className="space-y-0.5">
      {submitted.email && (
        <li className="break-all"><Matched matched={emailsMatch(submitted.email, account?.email)}>{submitted.email}</Matched></li>
      )}
      {phones.map((p) => (
        <li key={p}><Matched matched={phonesMatch(p, account?.phone)}>{formatPhone(p)}</Matched></li>
      ))}
    </ul>
  )
}

/** "by <name> on <date>" for handled requests. */
export function ResolvedLine({ item }) {
  if (item.status === 'PENDING' || (!item.resolvedBy && !item.resolvedAt)) return null
  return (
    <p className="text-xs text-ink/50 mt-1">
      {item.resolvedBy && <>by {item.resolvedBy.name}</>}
      {item.resolvedAt && <> on {formatDateTime(item.resolvedAt)}</>}
    </p>
  )
}

/** Reset / Reject buttons — only shown for PENDING requests. */
export function RecoveryActionButtons({ item, busy, onReset, onReject, size = 'sm' }) {
  if (item.status !== 'PENDING') return null
  return (
    <div className="flex flex-wrap gap-2">
      <Button size={size} disabled={busy} onClick={() => onReset(item)}>Reset Password</Button>
      <Button size={size} variant="danger-ghost" disabled={busy} onClick={() => onReject(item)}>Reject</Button>
    </div>
  )
}
