import { useEffect, useState } from 'react'
import { Loader2, Check, X, Lock } from 'lucide-react'
import { schoolPermissionsApi } from '../permissions.api.js'
import { ROLE_PERMISSIONS, flatItems } from '../../../config/permissionCatalog.js'
import { getErrorMessage } from '../../../api/httpClient.js'
import { Badge } from '../../../components/ui.jsx'

export default function SchoolRolePermissionsTab({ schoolId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    schoolPermissionsApi.getRolePermissions(schoolId)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err, 'Could not load role permissions.')) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [schoolId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-ink/40">
        <Loader2 size={22} className="animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-4 py-3">{error}</p>
    )
  }

  const roles = data?.roles ?? []
  const items = flatItems(ROLE_PERMISSIONS)

  if (roles.length === 0) {
    return (
      <p className="text-sm text-ink/50 py-8 text-center">No custom roles have been created for this school yet.</p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden min-w-[600px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface">
              <th className="text-left px-4 py-3 font-semibold text-ink/70 sticky left-0 bg-surface">Permission</th>
              {roles.map((r) => (
                <th key={r.role.id} className="text-center px-3 py-3 font-semibold text-ink/70 whitespace-nowrap">
                  <span>{r.role.name}</span>
                  {!r.isActive && (
                    <Badge tone="inactive" className="ml-1.5 text-[10px]">Inactive</Badge>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item.key} className="hover:bg-line/20">
                <td className="px-4 py-2.5 text-ink sticky left-0 bg-surface">{item.label}</td>
                {roles.map((r) => {
                  const eff = r.effectivePermissions?.[item.key]
                  const blocked = r.blockedBySchool?.includes(item.key)
                  return (
                    <td key={r.role.id} className="text-center px-3 py-2.5">
                      {blocked ? (
                        <Lock size={14} className="inline text-ink/25" />
                      ) : item.type === 'boolean' ? (
                        eff ? (
                          <Check size={14} className="inline text-success" />
                        ) : (
                          <X size={14} className="inline text-ink/20" />
                        )
                      ) : (
                        <span className="text-ink/60">{eff ?? '—'}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
