import { useEffect, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { inputClass } from '../../../../components/ui.jsx'
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue.js'
import { teachersApi } from '../../teachers/teachers.api.js'

/**
 * Searchable active-teacher picker. `value` is { id, name } | null.
 * Results come from the server (`search=`), so it scales past one page of teachers.
 */
export default function TeacherSelect({ value, onChange, invalid = false, compact = false, placeholder = 'Search teacher…' }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const rootRef = useRef(null)
  const search = useDebouncedValue(query.trim())

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    setLoading(true)
    teachersApi
      .list({ status: 'ACTIVE', pageSize: 100, search })
      .then((res) => !cancelled && setItems(res.items))
      .catch(() => !cancelled && setItems([]))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [open, search])

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const pick = (teacher) => {
    onChange(teacher ? { id: teacher.id, name: teacher.name } : null)
    setQuery('')
    setOpen(false)
  }

  const size = compact ? '!py-1.5 !px-2.5' : ''
  const border = invalid ? '!border-coral' : ''

  return (
    <div ref={rootRef} className="relative">
      {value && !open ? (
        <div className={`${inputClass} ${size} ${border} flex items-center justify-between gap-2 cursor-pointer`} onClick={() => setOpen(true)}>
          <span className="truncate">{value.name}</span>
          <button type="button" aria-label="Clear invigilator" className="text-ink/40 hover:text-coral shrink-0" onClick={(e) => { e.stopPropagation(); pick(null) }}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <input
          className={`${inputClass} ${size} ${border}`}
          value={query}
          placeholder={value ? value.name : placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        />
      )}
      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[220px] max-h-56 overflow-y-auto rounded-lg border border-line bg-surface shadow-pop">
          {loading && <div className="flex items-center gap-2 px-3 py-2 text-xs text-ink/50"><Loader2 size={13} className="animate-spin" /> Searching…</div>}
          {!loading && items.length === 0 && <p className="px-3 py-2 text-xs text-ink/50">No active teachers found.</p>}
          {items.map((t) => (
            <button key={t.id} type="button" className="block w-full text-left px-3 py-2 text-sm hover:bg-line/40" onClick={() => pick(t)}>
              <span className="font-medium text-ink">{t.name}</span>
              {t.employeeId && <span className="ml-2 text-xs text-ink/45">{t.employeeId}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
