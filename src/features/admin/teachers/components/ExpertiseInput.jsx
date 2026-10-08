import { useId, useState } from 'react'
import { X } from 'lucide-react'
import { inputClass } from '../../../../components/ui.jsx'

/**
 * Chip input for free-text subject names, with datalist suggestions. The
 * text input comes first so a wrapping <Field> label focuses it rather than a
 * chip's remove button.
 */
export default function ExpertiseInput({ value, onChange, suggestions = [], placeholder = 'Type a subject and press Enter' }) {
  const [draft, setDraft] = useState('')
  const listId = useId()

  const add = (raw) => {
    const name = raw.trim()
    if (!name) return
    if (!value.some((v) => v.toLowerCase() === name.toLowerCase())) onChange([...value, name])
    setDraft('')
  }

  const remove = (name) => onChange(value.filter((v) => v !== name))

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) {
      remove(value[value.length - 1])
    }
  }

  const onInput = (e) => {
    const next = e.target.value
    // Picking a datalist option fires a plain change with the full value.
    if (suggestions.includes(next) && e.nativeEvent?.inputType !== 'insertText') {
      add(next)
      return
    }
    setDraft(next)
  }

  const remaining = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))

  return (
    <div>
      <input
        className={inputClass}
        value={draft}
        onChange={onInput}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        list={listId}
        placeholder={placeholder}
      />
      <datalist id={listId}>
        {remaining.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((name) => (
            <span key={name} className="inline-flex items-center gap-1 rounded-full bg-board/10 text-board border border-board/20 pl-2.5 pr-1 py-0.5 text-xs font-semibold">
              {name}
              <button type="button" onClick={() => remove(name)} className="rounded-full p-0.5 hover:bg-board/15" aria-label={`Remove ${name}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {remaining.slice(0, 12).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-dashed border-line-strong px-2.5 py-0.5 text-xs text-ink/60 hover:text-board hover:border-board/40 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
