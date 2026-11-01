import { useEffect, useState, useCallback, useRef } from 'react'
import { Loader2, RotateCcw, ChevronDown } from 'lucide-react'
import { schoolPermissionsApi } from '../permissions.api.js'
import { SCHOOL_PERMISSIONS, getPerm, flatItems } from '../../../config/permissionCatalog.js'
import { getErrorMessage } from '../../../api/httpClient.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { ConfirmDialog } from '../../../components/ui.jsx'

function PermissionInput({ item, value, saving, onToggle, onValueChange }) {
  const debounceRef = useRef(null)

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

function PermissionGroup({ group, permissions, savingKeys, onToggle, onValueChange }) {
  const allBooleans = group.items.filter((i) => i.type === 'boolean')
  const allOn = allBooleans.length > 0 && allBooleans.every((i) => getPerm(permissions, i.key, i))
  const groupSaving = group.items.some((i) => savingKeys.has(i.key))

  const toggleAll = () => {
    const target = !allOn
    for (const item of allBooleans) {
      if (getPerm(permissions, item.key, item) !== target && !savingKeys.has(item.key)) {
        onToggle(item.key, target)
      }
    }
  }

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
        <h3 className="font-display text-sm font-semibold text-ink">{group.group}</h3>
        {allBooleans.length > 1 && (
          <button
            type="button"
            onClick={toggleAll}
            disabled={groupSaving}
            className="text-xs font-semibold text-board hover:text-board-light disabled:opacity-50 transition-colors"
          >
            {allOn ? 'Clear all' : 'Select all'}
          </button>
        )}
      </div>
      <div className="divide-y divide-line">
        {group.items.map((item) => (
          <div key={item.key} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-ink">{item.label}</span>
            <PermissionInput
              item={item}
              value={getPerm(permissions, item.key, item)}
              saving={savingKeys.has(item.key)}
              onToggle={onToggle}
              onValueChange={onValueChange}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SchoolPermissionsTab({ schoolId }) {
  const { notify } = useToast()
  const [permissions, setPermissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingKeys, setSavingKeys] = useState(new Set())
  const [confirmReset, setConfirmReset] = useState(false)
  const [otherOpen, setOtherOpen] = useState(false)

  const catalogKeys = new Set(flatItems(SCHOOL_PERMISSIONS).map((i) => i.key))

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await schoolPermissionsApi.get(schoolId)
      setPermissions(data.permissions ?? {})
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load permissions.'))
    } finally {
      setLoading(false)
    }
  }, [schoolId])

  useEffect(() => { load() }, [load])

  const patchKey = async (key, value) => {
    setSavingKeys((prev) => new Set(prev).add(key))
    const prev = permissions[key]
    setPermissions((p) => ({ ...p, [key]: value }))

    try {
      const data = await schoolPermissionsApi.patch(schoolId, { [key]: value })
      setPermissions(data.permissions ?? {})
    } catch (err) {
      setPermissions((p) => {
        const next = { ...p }
        if (prev === undefined) delete next[key]
        else next[key] = prev
        return next
      })
      notify(getErrorMessage(err, 'Could not update permission.'), 'error')
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const removeKey = async (key) => {
    setSavingKeys((prev) => new Set(prev).add(key))
    const prev = permissions[key]
    setPermissions((p) => {
      const next = { ...p }
      delete next[key]
      return next
    })

    try {
      await schoolPermissionsApi.patch(schoolId, { [key]: null })
    } catch (err) {
      setPermissions((p) => ({ ...p, [key]: prev }))
      notify(getErrorMessage(err, 'Could not remove key.'), 'error')
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const resetAll = async () => {
    try {
      const data = await schoolPermissionsApi.put(schoolId, {})
      setPermissions(data.permissions ?? {})
      notify('Permissions reset to defaults.', 'success')
    } catch (err) {
      notify(getErrorMessage(err, 'Could not reset permissions.'), 'error')
    }
  }

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

  const otherKeys = Object.keys(permissions).filter((k) => !catalogKeys.has(k))

  return (
    <div className="max-w-3xl space-y-5">
      {SCHOOL_PERMISSIONS.map((group) => (
        <PermissionGroup
          key={group.group}
          group={group}
          permissions={permissions}
          savingKeys={savingKeys}
          onToggle={patchKey}
          onValueChange={patchKey}
        />
      ))}

      {otherKeys.length > 0 && (
        <div className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
          <button
            type="button"
            onClick={() => setOtherOpen(!otherOpen)}
            className="flex w-full items-center justify-between px-5 py-3.5"
          >
            <span className="font-display text-sm font-semibold text-ink/60">
              Other saved keys ({otherKeys.length})
            </span>
            <ChevronDown size={16} className={`text-ink/40 transition-transform ${otherOpen ? 'rotate-180' : ''}`} />
          </button>
          {otherOpen && (
            <div className="divide-y divide-line border-t border-line">
              {otherKeys.map((key) => (
                <div key={key} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="text-sm font-mono text-ink/70">{key}</span>
                    <span className="ml-2 text-xs text-ink/40">{JSON.stringify(permissions[key])}</span>
                  </div>
                  <button
                    type="button"
                    disabled={savingKeys.has(key)}
                    onClick={() => removeKey(key)}
                    className="text-xs font-semibold text-coral hover:text-coral/80 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-ink/60 hover:text-ink border border-line hover:border-ink/20 transition-colors"
        >
          <RotateCcw size={14} /> Reset to defaults
        </button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetAll}
        title="Reset all permissions?"
        message="This will clear all saved permissions for this school and revert to defaults. Role permissions that depend on these will also be affected."
        confirmLabel="Reset"
        danger
      />
    </div>
  )
}
