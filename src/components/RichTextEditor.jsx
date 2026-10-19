import { useCallback, useEffect, useRef, useState } from 'react'
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link2, RemoveFormatting, Quote } from 'lucide-react'

const BLOCKS = [
  { value: 'P', label: 'Normal text' },
  { value: 'H3', label: 'Heading' },
  { value: 'H4', label: 'Subheading' },
]

function ToolButton({ active, label, onClick, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={!!active}
      // mousedown would steal the selection from the editor before the command runs
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${active ? 'bg-board/15 text-board' : 'text-ink/60 hover:bg-line/50 hover:text-ink'}`}
    >
      {children}
    </button>
  )
}

/**
 * Small rich-text editor on contentEditable: text style (heading), bold / italic / underline,
 * bullet + numbered lists, quote, link and clear-formatting. `value` / `onChange` are HTML strings;
 * run the result through sanitizeHtml before rendering it anywhere.
 */
export default function RichTextEditor({ value, onChange, placeholder = 'Write here…', minHeight = '10rem', invalid = false, disabled = false }) {
  const ref = useRef(null)
  const [active, setActive] = useState({})
  const [block, setBlock] = useState('P')

  // Only push `value` into the DOM when it differs (e.g. cleared after submit) so the caret never jumps.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) ref.current.innerHTML = value || ''
  }, [value])

  const refreshState = useCallback(() => {
    const sel = window.getSelection()
    if (!ref.current || !sel?.anchorNode || !ref.current.contains(sel.anchorNode)) return
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strike: document.queryCommandState('strikeThrough'),
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList'),
    })
    const fmt = String(document.queryCommandValue('formatBlock') || '').toUpperCase().replace(/[<>]/g, '')
    setBlock(BLOCKS.some((b) => b.value === fmt) ? fmt : 'P')
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', refreshState)
    return () => document.removeEventListener('selectionchange', refreshState)
  }, [refreshState])

  const emit = () => onChange?.(ref.current.innerHTML)

  const run = (command, arg) => {
    ref.current.focus()
    document.execCommand(command, false, arg)
    emit()
    refreshState()
  }

  const addLink = () => {
    const url = window.prompt('Link address (https://…)')
    if (!url) return
    const trimmed = url.trim()
    if (!/^https?:\/\//i.test(trimmed)) {
      window.alert('Enter a full link starting with http:// or https://')
      return
    }
    run('createLink', trimmed)
  }

  const onPaste = (e) => {
    e.preventDefault() // plain text only — pasted web/Word styling would otherwise leak in
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
  }

  return (
    <div className={`rounded-lg border bg-surface focus-within:ring-2 focus-within:ring-board/15 focus-within:border-board ${invalid ? 'border-coral' : 'border-line'} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
        <select
          aria-label="Text style"
          value={block}
          onChange={(e) => run('formatBlock', e.target.value)}
          className="text-sm rounded-md border border-line bg-surface px-2 py-1 text-ink/80 outline-none"
        >
          {BLOCKS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <span className="w-px h-5 bg-line mx-1" aria-hidden="true" />
        <ToolButton label="Bold" active={active.bold} onClick={() => run('bold')}><Bold size={16} /></ToolButton>
        <ToolButton label="Italic" active={active.italic} onClick={() => run('italic')}><Italic size={16} /></ToolButton>
        <ToolButton label="Underline" active={active.underline} onClick={() => run('underline')}><Underline size={16} /></ToolButton>
        <ToolButton label="Strikethrough" active={active.strike} onClick={() => run('strikeThrough')}><Strikethrough size={16} /></ToolButton>
        <span className="w-px h-5 bg-line mx-1" aria-hidden="true" />
        <ToolButton label="Bullet list" active={active.ul} onClick={() => run('insertUnorderedList')}><List size={16} /></ToolButton>
        <ToolButton label="Numbered list" active={active.ol} onClick={() => run('insertOrderedList')}><ListOrdered size={16} /></ToolButton>
        <ToolButton label="Quote" onClick={() => run('formatBlock', 'BLOCKQUOTE')}><Quote size={16} /></ToolButton>
        <ToolButton label="Add link" onClick={addLink}><Link2 size={16} /></ToolButton>
        <ToolButton label="Clear formatting" onClick={() => { run('removeFormat'); run('formatBlock', 'P') }}><RemoveFormatting size={16} /></ToolButton>
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label="Message"
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onPaste={onPaste}
        onKeyUp={refreshState}
        onMouseUp={refreshState}
        className="rich-editor rich-content px-3.5 py-3 text-sm text-ink outline-none overflow-y-auto"
        style={{ minHeight, maxHeight: '24rem' }}
      />
    </div>
  )
}
