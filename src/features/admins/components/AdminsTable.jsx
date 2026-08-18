import { Users2, Pencil, UserX, UserCheck } from 'lucide-react'
import { Badge, EmptyState } from '../../../components/ui.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminsTable({ admins, showSchool = false, onEdit, onToggleStatus }) {
  if (admins.length === 0) {
    return (
      <EmptyState
        icon={Users2}
        title="No admins yet"
        message="Add an admin so this school can manage its own account."
      />
    )
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/45">
          <th className="px-5 py-3 font-semibold">Name</th>
          <th className="px-5 py-3 font-semibold">Email</th>
          <th className="px-5 py-3 font-semibold">Phone</th>
          {showSchool && <th className="px-5 py-3 font-semibold">School</th>}
          <th className="px-5 py-3 font-semibold">Status</th>
          <th className="px-5 py-3 font-semibold">Created</th>
          <th className="px-5 py-3 font-semibold"></th>
        </tr>
      </thead>
      <tbody>
        {admins.map((admin) => (
          <tr key={admin.id} className="border-b border-line last:border-0">
            <td className="px-5 py-3.5 font-semibold text-ink">{admin.name}</td>
            <td className="px-5 py-3.5 text-ink/65">{admin.email}</td>
            <td className="px-5 py-3.5 text-ink/65">{admin.phone || '—'}</td>
            {showSchool && <td className="px-5 py-3.5 text-ink/65">{admin.schoolName || '—'}</td>}
            <td className="px-5 py-3.5">
              <Badge tone={admin.isActive ? 'active' : 'inactive'}>{admin.isActive ? 'Active' : 'Inactive'}</Badge>
            </td>
            <td className="px-5 py-3.5 text-ink/55">{formatDate(admin.createdAt)}</td>
            <td className="px-5 py-3.5">
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => onEdit(admin)}
                  className="text-ink/40 hover:text-ink hover:bg-line/50 rounded-lg p-1.5 transition-colors"
                  aria-label={`Edit ${admin.name}`}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => onToggleStatus(admin)}
                  className={`flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-colors ${
                    admin.isActive
                      ? 'text-coral hover:bg-coral/8'
                      : 'text-board hover:bg-board/8'
                  }`}
                >
                  {admin.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                  {admin.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
