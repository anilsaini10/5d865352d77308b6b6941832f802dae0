import { useEffect } from 'react'
import { Modal, PageLoader } from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { useToast } from '../../../../context/ToastContext.jsx'
import { formatDateTime, timeAgo } from '../../../../utils/format.js'
import { recoveryApi } from '../recovery.api.js'
import { formatPhone } from '../recovery.constants.js'
import { ContactList, RecoveryActionButtons, ResolvedLine, RoleChip, StatusChip } from './RecoveryParts.jsx'

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</dt>
      <dd className="text-sm text-ink mt-0.5">{children}</dd>
    </div>
  )
}

/** Detail view of one request. `requestId` null = closed. `onGone` is called when the request no longer exists. */
export default function RecoveryDetailModal({ requestId, busy, onReset, onReject, onClose, onGone }) {
  const { notify } = useToast()
  const { data: item, error } = useFetch(() => recoveryApi.get(requestId), [requestId], { enabled: !!requestId })

  useEffect(() => {
    if (!error) return
    notify(error, 'error')
    onGone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  const shown = item?.id === requestId ? item : null
  const account = shown?.account

  return (
    <Modal open={!!requestId} onClose={onClose} wide title="Recovery request" subtitle={shown ? `Requested ${timeAgo(shown.updatedAt)}` : undefined}>
      {!shown ? (
        <PageLoader className="py-10" />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <StatusChip status={shown.status} />
            <p className="text-xs text-ink/50">First submitted {formatDateTime(shown.createdAt)}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <section className="rounded-xl border border-line p-4">
              <h3 className="font-display font-semibold text-ink mb-3">Submitted details</h3>
              <dl className="space-y-3">
                <Field label="Name">{shown.submitted.name}</Field>
                <Field label="Email & phones"><ContactList submitted={shown.submitted} account={account} /></Field>
              </dl>
            </section>

            <section className="rounded-xl border border-line p-4">
              <h3 className="font-display font-semibold text-ink mb-3">Matched account</h3>
              <dl className="space-y-3">
                <Field label="Name">
                  <span className="mr-2">{account.name}</span>
                  <RoleChip role={account.role} />
                </Field>
                <Field label="Email">{account.email || <span className="text-ink/40">—</span>}</Field>
                <Field label="Phone">{account.phone ? formatPhone(account.phone) : <span className="text-ink/40">—</span>}</Field>
                <Field label="Username">{account.username || <span className="text-ink/40">—</span>}</Field>
                <Field label="Account">{account.isActive ? 'Active' : 'Inactive'}</Field>
              </dl>
            </section>
          </div>

          <ResolvedLine item={shown} />
          <RecoveryActionButtons item={shown} busy={busy} onReset={onReset} onReject={onReject} size="md" />
        </div>
      )}
    </Modal>
  )
}
