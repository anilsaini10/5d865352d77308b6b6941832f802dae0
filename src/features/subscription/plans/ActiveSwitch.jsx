/** Small on/off toggle used for "Active" columns. */
export default function ActiveSwitch({ checked, busy, label, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${checked ? 'Deactivate' : 'Activate'} ${label}`}
      disabled={busy}
      onClick={onToggle}
      className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-board' : 'bg-line'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  )
}
