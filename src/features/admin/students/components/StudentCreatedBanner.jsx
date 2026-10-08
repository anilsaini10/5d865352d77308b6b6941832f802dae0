import { Link2, X } from 'lucide-react'
import { CredentialsBanner } from '../../../../components/ui.jsx'

/**
 * Shown after adding a student. A brand-new parent account gets the default
 * password; a reused one (matched by email or phone) has no password to show.
 */
export default function StudentCreatedBanner({ student, parentAccount, onDismiss }) {
  if (parentAccount?.isNew) {
    return (
      <CredentialsBanner
        title={`${student.name} was added`}
        description="A parent login was created. Share these credentials with the parent and ask them to change the password after first sign-in."
        loginId={parentAccount.email}
        password={parentAccount.defaultPassword || '123456'}
        onDismiss={onDismiss}
      />
    )
  }

  return (
    <div className="relative flex items-start gap-3 bg-info/10 border border-info/25 text-ink rounded-2xl p-4 pr-12 mb-6 animate-rise">
      <div className="w-9 h-9 rounded-full bg-info/15 text-info flex items-center justify-center shrink-0">
        <Link2 size={17} />
      </div>
      <div className="min-w-0">
        <p className="font-display font-semibold">{student.name} was added</p>
        <p className="text-sm text-ink/70 mt-0.5 break-words">
          Linked to existing parent account <span className="font-semibold text-ink">{parentAccount?.email}</span>. The parent
          keeps their current password — no new credentials were created.
        </p>
      </div>
      <button onClick={onDismiss} className="absolute right-3 top-3 text-ink/50 hover:text-ink p-1 rounded-full hover:bg-line/40" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  )
}
