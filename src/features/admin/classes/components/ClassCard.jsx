import { useState } from 'react'
import { ChevronDown, Pencil, Trash2, Plus, Link2, UserRound } from 'lucide-react'
import { Badge, Button, IconButton, selectClass } from '../../../../components/ui.jsx'
import { formatNumber } from '../../../../utils/format.js'

function CapacityBar({ count, capacity }) {
  const ratio = capacity > 0 ? count / capacity : 0
  const pct = Math.min(100, Math.round(ratio * 100))
  const tone = ratio > 1 ? 'bg-coral' : ratio >= 0.9 ? 'bg-warning' : 'bg-board'
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-ink/55">Students</span>
        <span className={`font-semibold ${ratio > 1 ? 'text-coral' : 'text-ink/80'}`}>
          {formatNumber(count)} / {formatNumber(capacity)}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full bg-line/60 mt-1 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={count}
        aria-label={`${count} of ${capacity} seats filled`}
      >
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function SectionRow({ section, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[4rem_minmax(0,1fr)_minmax(0,14rem)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-line last:border-0">
      <div className="w-10 h-10 rounded-xl bg-board/10 text-board font-display font-semibold flex items-center justify-center">
        {section.name}
      </div>
      <div className="min-w-0 flex items-center gap-1.5 text-sm">
        <UserRound size={15} className="text-ink/35 shrink-0" />
        {section.classTeacherName ? (
          <span className="text-ink/80 truncate">{section.classTeacherName}</span>
        ) : (
          <span className="text-ink/45 italic truncate">No class teacher</span>
        )}
      </div>
      <div className="col-span-3 sm:col-span-1 row-start-2 sm:row-start-auto">
        <CapacityBar count={section.studentCount ?? 0} capacity={section.capacity} />
      </div>
      <div className="flex items-center gap-0.5 col-start-3 row-start-1 sm:col-start-auto sm:row-start-auto">
        <IconButton icon={Pencil} label={`Edit section ${section.name}`} onClick={onEdit} />
        <IconButton icon={Trash2} tone="danger" label={`Delete section ${section.name}`} onClick={onDelete} />
      </div>
    </div>
  )
}

function SubjectLinker({ schoolClass, subjects, onLink }) {
  const [subjectId, setSubjectId] = useState('')
  const [busy, setBusy] = useState(false)
  const linkedIds = new Set((schoolClass.subjects ?? []).map((s) => s.id))
  const available = (subjects ?? []).filter((s) => !linkedIds.has(s.id)).sort((a, b) => a.name.localeCompare(b.name))

  const link = async () => {
    if (!subjectId) return
    setBusy(true)
    const ok = await onLink(subjectId)
    setBusy(false)
    if (ok) setSubjectId('')
  }

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide font-semibold text-ink/45 mb-2">Subjects</h4>
      {schoolClass.subjects?.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[...schoolClass.subjects]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((s) => (
              <span key={s.id} className="inline-flex items-center rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-ink/75">
                {s.name}
              </span>
            ))}
        </div>
      ) : (
        <p className="text-sm text-ink/45 mb-3">No subjects linked yet.</p>
      )}
      {subjects && available.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 sm:max-w-md">
          <select
            className={selectClass}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            aria-label={`Subject to link to ${schoolClass.name}`}
          >
            <option value="">Choose a subject…</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Button variant="secondary" icon={Link2} onClick={link} loading={busy} disabled={!subjectId} className="shrink-0">
            Link subject
          </Button>
        </div>
      )}
      {subjects && subjects.length > 0 && available.length === 0 && (
        <p className="text-xs text-ink/45">Every subject is already linked to this class.</p>
      )}
      {subjects && subjects.length === 0 && (
        <p className="text-xs text-ink/45">Create subjects on the Subjects page to link them here.</p>
      )}
    </div>
  )
}

export default function ClassCard({
  schoolClass,
  expanded,
  onToggle,
  subjects,
  onEdit,
  onDelete,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onLinkSubject,
}) {
  const sections = [...(schoolClass.sections ?? [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  const panelId = `class-panel-${schoolClass.id}`

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-card">
      <div className="flex items-center gap-2 pr-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex-1 min-w-0 flex items-center gap-3 px-4 sm:px-5 py-4 text-left"
        >
          <ChevronDown size={18} className={`text-ink/40 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-ink text-lg truncate">{schoolClass.name}</h3>
              <Badge tone="neutral">Level {schoolClass.numericLevel}</Badge>
            </div>
            <p className="text-sm text-ink/55 mt-0.5">
              {sections.length} {sections.length === 1 ? 'section' : 'sections'} · {formatNumber(schoolClass.totalStudents ?? 0)} active students
              {' · '}
              {schoolClass.subjects?.length ?? 0} {schoolClass.subjects?.length === 1 ? 'subject' : 'subjects'}
            </p>
          </div>
        </button>
        <IconButton icon={Pencil} label={`Edit ${schoolClass.name}`} onClick={onEdit} />
        <IconButton icon={Trash2} tone="danger" label={`Delete ${schoolClass.name}`} onClick={onDelete} />
      </div>

      {expanded && (
        <div id={panelId} className="border-t border-line px-4 sm:px-5 py-4 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs uppercase tracking-wide font-semibold text-ink/45">Sections</h4>
              <Button variant="ghost" size="sm" icon={Plus} onClick={onAddSection}>
                Add section
              </Button>
            </div>
            {sections.length > 0 ? (
              <div className="border border-line rounded-xl bg-paper/50">
                {sections.map((s) => (
                  <SectionRow key={s.id} section={s} onEdit={() => onEditSection(s)} onDelete={() => onDeleteSection(s)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/45">No sections yet.</p>
            )}
          </div>

          <SubjectLinker schoolClass={schoolClass} subjects={subjects} onLink={onLinkSubject} />
        </div>
      )}
    </div>
  )
}
