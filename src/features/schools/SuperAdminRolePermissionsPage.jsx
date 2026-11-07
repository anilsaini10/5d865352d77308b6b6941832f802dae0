import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Lock, RotateCcw, Check, X } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import { Badge, Button, ConfirmDialog, PageLoader, SearchInput, Tabs, selectClass } from '../../components/ui.jsx'
import { schoolsApi } from './schools.api.js'
import { schoolPermissionsApi } from './permissions.api.js'
import { ROLE_PERMISSIONS, flatItems } from '../../config/permissionCatalog.js'
import { getErrorMessage } from '../../api/httpClient.js'
import { useToast } from '../../context/ToastContext.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'

const catalogItems = flatItems(ROLE_PERMISSIONS)

function buildFullLimits(limits, isAdmin) {
  const full = {}
  for (const item of catalogItems) {
    if (item.type !== 'boolean') continue
    if (isAdmin) {
      full[item.key] = limits[item.key] === true
    } else {
      full[item.key] = limits[item.key] !== false
    }
  }
  return full
}

function Toggle({ checked, disabled, saving, hint, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled || saving}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-board' : 'bg-line'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : saving ? 'opacity-50' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-paper transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {saving && <Loader2 size={12} className="animate-spin text-ink/40" />}
      {hint && <span className="text-xs text-ink/40 flex items-center gap-1"><Lock size={10} /> {hint}</span>}
    </div>
  )
}

function PermissionGroup({ group, limits, schoolPerms, adminLimits, isAdmin, dirty, saving, search, onToggle }) {
  const items = group.items.filter((i) => i.type === 'boolean')
  const filtered = search ? items.filter((i) => i.label.toLowerCase().includes(search) || i.key.toLowerCase().includes(search)) : items
  if (filtered.length === 0) return null

  const allChecked = filtered.every((i) => dirty[i.key] ?? (isAdmin ? limits[i.key] === true : limits[i.key] !== false))
  const toggleAll = () => {
    const target = !allChecked
    for (const item of filtered) {
      const blockedBySchool = !isAdmin && schoolPerms[item.key] === false
      if (blockedBySchool) continue
      const blockedByAdmin = !isAdmin && adminLimits[item.key] === false
      if (blockedByAdmin) continue
      onToggle(item.key, target)
    }
  }

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
        <h3 className="font-display text-sm font-semibold text-ink">{group.group}</h3>
        {filtered.length > 1 && (
          <button type="button" onClick={toggleAll} disabled={saving}
            className="text-xs font-semibold text-board hover:text-board-light disabled:opacity-50 transition-colors">
            {allChecked ? 'Clear all' : 'Select all'}
          </button>
        )}
      </div>
      <div className="divide-y divide-line">
        {filtered.map((item) => {
          const checked = dirty[item.key] ?? (isAdmin ? limits[item.key] === true : limits[item.key] !== false)
          const blockedBySchool = !isAdmin && schoolPerms[item.key] === false
          const blockedByAdmin = !isAdmin && adminLimits[item.key] === false
          const disabled = blockedBySchool || blockedByAdmin
          const hint = blockedBySchool
            ? 'Disabled for this school'
            : blockedByAdmin ? 'Capped by Admin limit' : null

          return (
            <div key={item.key} className="flex items-center justify-between px-5 py-3">
              <div>
                <span className={`text-sm ${disabled ? 'text-ink/40' : 'text-ink'}`}>{item.label}</span>
                <span className="ml-2 text-[11px] text-ink/30 font-mono">{item.key}</span>
              </div>
              <Toggle checked={checked} disabled={disabled} saving={saving} hint={hint}
                onChange={(val) => onToggle(item.key, val)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SuperAdminRolePermissionsPage() {
  const { notify } = useToast()

  const [schools, setSchools] = useState([])
  const [schoolsLoading, setSchoolsLoading] = useState(true)
  const [schoolsError, setSchoolsError] = useState('')

  const [schoolId, setSchoolId] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 300)

  const [rolesData, setRolesData] = useState(null)
  const [rolesLoading, setRolesLoading] = useState(false)
  const [rolesError, setRolesError] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [dirty, setDirty] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const isDirty = Object.keys(dirty).length > 0

  useEffect(() => {
    let cancelled = false
    setSchoolsLoading(true)
    setSchoolsError('')
    schoolsApi
      .list({ page: 1, pageSize: 100 })
      .then((data) => {
        if (cancelled) return
        const items = Array.isArray(data) ? data : data?.items ?? []
        setSchools(items)
      })
      .catch((err) => {
        if (cancelled) return
        setSchoolsError(getErrorMessage(err, 'Could not load schools.'))
      })
      .finally(() => {
        if (!cancelled) setSchoolsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const loadRoles = useCallback(async (sid) => {
    if (!sid) { setRolesData(null); return }
    setRolesLoading(true)
    setRolesError('')
    try {
      const data = await schoolPermissionsApi.getRolePermissions(sid)
      setRolesData(data)
      setSelectedRoleId((prev) => {
        const ids = data.roles.map((r) => r.role.id)
        return ids.includes(prev) ? prev : ids[0] ?? ''
      })
      setDirty({})
    } catch (err) {
      setRolesError(getErrorMessage(err, 'Could not load role permissions.'))
    } finally {
      setRolesLoading(false)
    }
  }, [])

  useEffect(() => { loadRoles(schoolId) }, [schoolId, loadRoles])

  const roles = rolesData?.roles ?? []
  const schoolPerms = rolesData?.schoolPermissions ?? {}
  const selectedRole = roles.find((r) => r.role.id === selectedRoleId)
  const isAdmin = selectedRole?.role.key === 'ADMIN'
  const adminRole = roles.find((r) => r.role.key === 'ADMIN')
  const adminLimits = adminRole?.limits ?? {}

  const roleTabs = useMemo(() =>
    roles.map((r) => ({
      value: r.role.id,
      label: r.role.name + (r.isActive === false ? ' (Inactive)' : ''),
    })),
    [roles],
  )

  const switchRole = (roleId) => {
    if (isDirty) {
      setConfirmDiscard(() => () => {
        setDirty({})
        setSelectedRoleId(roleId)
        setConfirmDiscard(null)
      })
      return
    }
    setSelectedRoleId(roleId)
  }

  const switchSchool = (sid) => {
    if (isDirty) {
      setConfirmDiscard(() => () => {
        setDirty({})
        setSchoolId(sid)
        setConfirmDiscard(null)
      })
      return
    }
    setSchoolId(sid)
  }

  const onToggle = (key, value) => {
    setDirty((prev) => {
      const current = isAdmin
        ? (selectedRole?.limits?.[key] === true)
        : (selectedRole?.limits?.[key] !== false)
      if (value === current) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: value }
    })
  }

  const handleSave = async () => {
    if (!selectedRole || !schoolId) return
    setSaving(true)
    try {
      const merged = { ...(selectedRole.limits ?? {}), ...dirty }
      const full = buildFullLimits(merged, isAdmin)
      const updated = await schoolPermissionsApi.putRolePermission(schoolId, selectedRoleId, full)
      setRolesData((prev) => ({
        ...prev,
        roles: prev.roles.map((r) => r.role.id === selectedRoleId ? updated : r),
      }))
      setDirty({})
      notify('Permissions saved.', 'success')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not save permissions.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!selectedRole || !schoolId) return
    try {
      const updated = await schoolPermissionsApi.putRolePermission(schoolId, selectedRoleId, {})
      setRolesData((prev) => ({
        ...prev,
        roles: prev.roles.map((r) => r.role.id === selectedRoleId ? updated : r),
      }))
      setDirty({})
      notify('Permissions reset to defaults.', 'success')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not reset permissions.'), 'error')
    }
  }

  if (schoolsLoading) {
    return (
      <AppShell title="Role Permissions" subtitle="Set the maximum each role can have — school admins can only toggle within these caps">
        <PageLoader />
      </AppShell>
    )
  }

  if (schoolsError) {
    return (
      <AppShell title="Role Permissions" subtitle="Set the maximum each role can have — school admins can only toggle within these caps">
        <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-4 py-3">{schoolsError}</p>
      </AppShell>
    )
  }

  return (
    <AppShell title="Role Permissions" subtitle="Set the maximum each role can have — school admins can only toggle within these caps">
      <div className="space-y-5">
        {/* School selector */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5">School</label>
            <select className={selectClass} value={schoolId} onChange={(e) => switchSchool(e.target.value)}>
              <option value="">Select a school</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {schoolId && !rolesLoading && roleTabs.length > 0 && (
            <SearchInput value={search} onChange={setSearch} placeholder="Filter permissions..." className="w-full sm:w-64" />
          )}
        </div>

        {!schoolId && (
          <p className="text-sm text-ink/50 py-12 text-center">Select a school above to manage role permission caps.</p>
        )}

        {rolesLoading && (
          <div className="flex items-center justify-center py-16 text-ink/40">
            <Loader2 size={22} className="animate-spin" />
          </div>
        )}

        {rolesError && (
          <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-4 py-3">{rolesError}</p>
        )}

        {schoolId && !rolesLoading && !rolesError && roleTabs.length > 0 && (
          <>
            {/* Role tabs */}
            <Tabs options={roleTabs} value={selectedRoleId} onChange={switchRole} />

            {selectedRole && (
              <div className="max-w-3xl space-y-5">
                {/* Info badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
                  <Badge tone={selectedRole.isActive === false ? 'inactive' : 'active'}>
                    {selectedRole.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                  {selectedRole.role.isBuiltIn && <Badge tone="info">Built-in</Badge>}
                  {isDirty && <Badge tone="warning">Unsaved changes</Badge>}
                </div>

                {/* Permission groups */}
                {ROLE_PERMISSIONS.map((group) => (
                  <PermissionGroup
                    key={group.group}
                    group={group}
                    limits={selectedRole.limits ?? {}}
                    schoolPerms={schoolPerms}
                    adminLimits={adminLimits}
                    isAdmin={isAdmin}
                    dirty={dirty}
                    saving={saving}
                    search={debouncedSearch}
                    onToggle={onToggle}
                  />
                ))}

                {/* Effective permissions (read-only) */}
                {selectedRole.effectivePermissions && Object.keys(selectedRole.effectivePermissions).length > 0 && (
                  <details className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
                    <summary className="px-5 py-3.5 text-sm font-semibold text-ink/60 cursor-pointer select-none">
                      Effective permissions (read-only)
                    </summary>
                    <div className="divide-y divide-line border-t border-line">
                      {catalogItems.filter((i) => i.type === 'boolean').map((item) => {
                        const eff = selectedRole.effectivePermissions[item.key]
                        return (
                          <div key={item.key} className="flex items-center justify-between px-5 py-2.5">
                            <span className="text-sm text-ink/70">{item.label}</span>
                            {eff ? (
                              <Check size={16} className="text-emerald-500" />
                            ) : (
                              <X size={16} className="text-ink/25" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </details>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Button loading={saving} disabled={!isDirty} onClick={handleSave}>Save</Button>
                  <Button variant="secondary" disabled={!isDirty || saving} onClick={() => setDirty({})}>Reset</Button>
                  <div className="flex-1" />
                  <button type="button" onClick={() => setConfirmReset(true)} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-ink/60 hover:text-ink border border-line hover:border-ink/20 transition-colors disabled:opacity-50">
                    <RotateCcw size={14} /> Reset to defaults
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Unsaved changes warning */}
      <ConfirmDialog
        open={!!confirmDiscard}
        onClose={() => setConfirmDiscard(null)}
        onConfirm={() => confirmDiscard?.()}
        title="Discard unsaved changes?"
        message="You have unsaved permission changes. Switching now will discard them."
        confirmLabel="Discard"
        danger
      />

      {/* Reset to defaults */}
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title="Reset to defaults?"
        message="This will remove all permission caps for this role, reverting to the system defaults."
        confirmLabel="Reset"
        danger
      />
    </AppShell>
  )
}
