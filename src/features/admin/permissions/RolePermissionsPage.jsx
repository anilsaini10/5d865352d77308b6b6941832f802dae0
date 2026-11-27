import { useEffect, useState, useCallback, useRef } from 'react'
import { Loader2, Lock, RotateCcw, Copy, Check } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { EmptyState, ConfirmDialog, Tabs } from '../../../components/ui.jsx'
import { rolePermissionsApi } from './permissions.api.js'
import { ROLE_PERMISSIONS, getPerm, flatItems } from '../../../config/permissionCatalog.js'
import { getErrorMessage, getErrorCode } from '../../../api/httpClient.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'

function enabledCount(effectivePermissions) {
  if (!effectivePermissions) return 0
  return Object.values(effectivePermissions).filter((v) => v === true).length
}

function RolePermissionInput({ item, value, blocked, saving, onToggle, onValueChange }) {
  const debounceRef = useRef(null)

  if (blocked) {
    return (
      <div className="flex items-center gap-2 text-ink/30" title="Disabled for your school by the platform admin">
        <Lock size={14} />
        <span className="text-xs">Locked</span>
      </div>
    )
  }

  if (item.type === 'boolean') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={!!value}
        disabled={saving}
        onClick={() => onToggle(item.key, !value)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          value ? 'bg-board' : 'bg-line'
        } ${saving ? 'opacity-50' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-paper transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        {saving && <Loader2 size={12} className="absolute -right-5 animate-spin text-ink/40" />}
      </button>
    )
  }

  if (item.type === 'number') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={item.min}
          max={item.max}
          value={value ?? ''}
          disabled={saving}
          onChange={(e) => {
            const v = e.target.value === '' ? item.default : Number(e.target.value)
            clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => onValueChange(item.key, v), 500)
          }}
          className="w-24 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-board focus:ring-2 focus:ring-board/15 transition-shadow"
        />
        {saving && <Loader2 size={14} className="animate-spin text-ink/40" />}
      </div>
    )
  }

  if (item.type === 'select') {
    return (
      <div className="flex items-center gap-2">
        <select
          value={value ?? item.default}
          disabled={saving}
          onChange={(e) => onValueChange(item.key, e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-board focus:ring-2 focus:ring-board/15 transition-shadow"
        >
          {item.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {saving && <Loader2 size={14} className="animate-spin text-ink/40" />}
      </div>
    )
  }

  if (item.type === 'string') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          maxLength={500}
          value={value ?? ''}
          disabled={saving}
          onChange={(e) => {
            const v = e.target.value
            clearTimeout(debounceRef.current)
            debounceRef.current = setTimeout(() => onValueChange(item.key, v), 500)
          }}
          className="w-48 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-board focus:ring-2 focus:ring-board/15 transition-shadow"
        />
        {saving && <Loader2 size={14} className="animate-spin text-ink/40" />}
      </div>
    )
  }

  return null
}

function RolePermissionGroup({ group, permissions, schoolPermissions, blockedBySchool, savingKeys, onToggle, onToggleAll, onValueChange }) {
  const boolItems = group.items.filter((i) => i.type === 'boolean')
  const toggleable = boolItems.filter((i) => !blockedBySchool.includes(i.key) && schoolPermissions[i.key] !== false)
  const allChecked = toggleable.length > 0 && toggleable.every((i) => getPerm(permissions, i.key, i))

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
        <h3 className="font-display text-sm font-semibold text-ink">{group.group}</h3>
        {toggleable.length > 1 && (
          <button
            type="button"
            onClick={() => onToggleAll(toggleable, !allChecked)}
            disabled={savingKeys.size > 0}
            className="text-xs font-semibold text-board hover:text-board-light disabled:opacity-50 transition-colors"
          >
            {allChecked ? 'Clear all' : 'Select all'}
          </button>
        )}
      </div>
      <div className="divide-y divide-line">
        {group.items.map((item) => {
          const blocked = blockedBySchool.includes(item.key) || schoolPermissions[item.key] === false
          return (
            <div key={item.key} className={`flex items-center justify-between px-5 py-3 ${blocked ? 'opacity-60' : ''}`}>
              <span className="text-sm text-ink">{item.label}</span>
              <RolePermissionInput
                item={item}
                value={getPerm(permissions, item.key, item)}
                blocked={blocked}
                saving={savingKeys.has(item.key)}
                onToggle={onToggle}
                onValueChange={onValueChange}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CompareView({ roles, schoolPermissions }) {
  const items = flatItems(ROLE_PERMISSIONS)

  return (
    <div className="overflow-x-auto">
      <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden min-w-[600px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface">
              <th className="text-left px-4 py-3 font-semibold text-ink/70 sticky left-0 bg-surface">Permission</th>
              {roles.map((r) => (
                <th key={r.role.id} className="text-center px-3 py-3 font-semibold text-ink/70 whitespace-nowrap">
                  {r.role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item.key} className="hover:bg-line/20">
                <td className="px-4 py-2.5 text-ink sticky left-0 bg-surface">{item.label}</td>
                {roles.map((r) => {
                  const blocked = r.blockedBySchool?.includes(item.key) || schoolPermissions[item.key] === false
                  const eff = r.effectivePermissions?.[item.key]
                  return (
                    <td key={r.role.id} className="text-center px-3 py-2.5">
                      {blocked ? (
                        <Lock size={14} className="inline text-ink/25" />
                      ) : item.type === 'boolean' ? (
                        eff ? <Check size={14} className="inline text-success" /> : <span className="text-ink/20">—</span>
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

const VIEW_TABS = [
  { value: 'edit', label: 'Edit' },
  { value: 'compare', label: 'Compare' },
]

export default function RolePermissionsPage() {
  const { notify } = useToast()
  const { user, refetchPermissions } = useAuth()
  const currentUserRoleId = user?.customRoleId

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [savingKeys, setSavingKeys] = useState(new Set())
  const [confirmClear, setConfirmClear] = useState(false)
  const [copySource, setCopySource] = useState(null)
  const [view, setView] = useState('edit')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await rolePermissionsApi.list()
      setData(result)
      if (!selectedRoleId && result.roles?.length > 0) {
        setSelectedRoleId(result.roles[0].role.id)
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load role permissions.'))
    } finally {
      setLoading(false)
    }
  }, [selectedRoleId])

  useEffect(() => { load() }, [load])

  const roles = data?.roles ?? []
  const schoolPermissions = data?.schoolPermissions ?? {}
  const selectedRole = roles.find((r) => r.role.id === selectedRoleId)

  const patchKey = async (key, value) => {
    if (!selectedRoleId) return
    setSavingKeys((prev) => new Set(prev).add(key))
    const prevPerms = selectedRole?.permissions?.[key]

    setData((d) => ({
      ...d,
      roles: d.roles.map((r) =>
        r.role.id === selectedRoleId ? { ...r, permissions: { ...r.permissions, [key]: value } } : r
      ),
    }))

    try {
      const updated = await rolePermissionsApi.patch(selectedRoleId, { [key]: value })
      setData((d) => ({
        ...d,
        roles: d.roles.map((r) => (r.role.id === selectedRoleId ? updated : r)),
      }))
      if (selectedRoleId === currentUserRoleId) refetchPermissions()
    } catch (err) {
      if (getErrorCode(err) === 'ROLE_NOT_FOUND') {
        notify('This role was deactivated. Refreshing list.', 'error')
        load()
        return
      }
      setData((d) => ({
        ...d,
        roles: d.roles.map((r) =>
          r.role.id === selectedRoleId
            ? { ...r, permissions: { ...r.permissions, [key]: prevPerms === undefined ? undefined : prevPerms } }
            : r
        ),
      }))
      notify(getErrorMessage(err, 'Could not update permission.'), 'error')
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const toggleGroupAll = async (items, value) => {
    if (!selectedRoleId || !selectedRole) return
    const patch = {}
    for (const item of items) patch[item.key] = value
    const merged = { ...(selectedRole.permissions ?? {}), ...patch }

    const prevPerms = { ...(selectedRole.permissions ?? {}) }
    setData((d) => ({
      ...d,
      roles: d.roles.map((r) =>
        r.role.id === selectedRoleId ? { ...r, permissions: merged } : r
      ),
    }))

    const keys = items.map((i) => i.key)
    setSavingKeys((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => next.add(k))
      return next
    })

    try {
      const updated = await rolePermissionsApi.put(selectedRoleId, merged)
      setData((d) => ({
        ...d,
        roles: d.roles.map((r) => (r.role.id === selectedRoleId ? updated : r)),
      }))
      if (selectedRoleId === currentUserRoleId) refetchPermissions()
    } catch (err) {
      setData((d) => ({
        ...d,
        roles: d.roles.map((r) =>
          r.role.id === selectedRoleId ? { ...r, permissions: prevPerms } : r
        ),
      }))
      notify(getErrorMessage(err, 'Could not update permissions.'), 'error')
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        keys.forEach((k) => next.delete(k))
        return next
      })
    }
  }

  const clearAll = async () => {
    if (!selectedRoleId) return
    try {
      const updated = await rolePermissionsApi.put(selectedRoleId, {})
      setData((d) => ({
        ...d,
        roles: d.roles.map((r) => (r.role.id === selectedRoleId ? updated : r)),
      }))
      if (selectedRoleId === currentUserRoleId) refetchPermissions()
      notify('All permissions cleared.', 'success')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not clear permissions.'), 'error')
    }
  }

  const copyFrom = async () => {
    if (!selectedRoleId || !copySource) return
    const source = roles.find((r) => r.role.id === copySource)
    if (!source) return
    try {
      const updated = await rolePermissionsApi.put(selectedRoleId, source.permissions)
      setData((d) => ({
        ...d,
        roles: d.roles.map((r) => (r.role.id === selectedRoleId ? updated : r)),
      }))
      if (selectedRoleId === currentUserRoleId) refetchPermissions()
      notify(`Copied permissions from ${source.role.name}.`, 'success')
      setCopySource(null)
    } catch (err) {
      notify(getErrorMessage(err, 'Could not copy permissions.'), 'error')
    }
  }

  return (
    <AppShell title="Role Permissions" subtitle="Manage what each custom role can do">
      {loading ? (
        <div className="flex items-center justify-center py-24 text-ink/40">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-4 py-3">{error}</p>
      ) : roles.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl shadow-card">
          <EmptyState
            title="No roles yet"
            message="Roles are created by the platform admin. Once custom roles exist, you can manage their permissions here."
          />
        </div>
      ) : (
        <>
          <div className="mb-5">
            <Tabs options={VIEW_TABS} value={view} onChange={setView} />
          </div>

          {view === 'compare' ? (
            <CompareView roles={roles} schoolPermissions={schoolPermissions} />
          ) : (
            <div className="flex gap-6 items-start">
              {/* Role list */}
              <div className="w-56 shrink-0 bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
                <div className="px-4 py-3 border-b border-line">
                  <h3 className="font-display text-sm font-semibold text-ink/70">Roles</h3>
                </div>
                <div className="divide-y divide-line">
                  {roles.map((r) => (
                    <button
                      key={r.role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(r.role.id)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        r.role.id === selectedRoleId ? 'bg-board/8 border-l-2 border-board' : 'hover:bg-line/30'
                      }`}
                    >
                      <p className="text-sm font-semibold text-ink">{r.role.name}</p>
                      <p className="text-xs text-ink/50 mt-0.5">
                        {enabledCount(r.effectivePermissions)} enabled
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission editor */}
              <div className="flex-1 min-w-0 space-y-5">
                {selectedRole && (
                  <>
                    {ROLE_PERMISSIONS.map((group) => (
                      <RolePermissionGroup
                        key={group.group}
                        group={group}
                        permissions={selectedRole.permissions ?? {}}
                        schoolPermissions={schoolPermissions}
                        blockedBySchool={selectedRole.blockedBySchool ?? []}
                        savingKeys={savingKeys}
                        onToggle={patchKey}
                        onToggleAll={toggleGroupAll}
                        onValueChange={patchKey}
                      />
                    ))}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirmClear(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-ink/60 hover:text-ink border border-line hover:border-ink/20 transition-colors"
                      >
                        <RotateCcw size={14} /> Clear all
                      </button>

                      {roles.length > 1 && (
                        <div className="flex items-center gap-2">
                          <select
                            value={copySource ?? ''}
                            onChange={(e) => setCopySource(e.target.value || null)}
                            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-board focus:ring-2 focus:ring-board/15 transition-shadow"
                          >
                            <option value="">Copy from role...</option>
                            {roles.filter((r) => r.role.id !== selectedRoleId).map((r) => (
                              <option key={r.role.id} value={r.role.id}>{r.role.name}</option>
                            ))}
                          </select>
                          {copySource && (
                            <button
                              type="button"
                              onClick={copyFrom}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-board text-paper hover:bg-board-light transition-colors"
                            >
                              <Copy size={14} /> Copy
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearAll}
        title="Clear all permissions?"
        message={`This will remove all permissions for "${selectedRole?.role?.name}". They can be reconfigured at any time.`}
        confirmLabel="Clear"
        danger
      />
    </AppShell>
  )
}
