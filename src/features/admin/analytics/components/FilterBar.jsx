import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { selectClass, inputClass, Button } from '../../../../components/ui.jsx'
import { useClasses } from '../../classes/useClasses.js'
import { useFetch } from '../../../../hooks/useFetch.js'
import { subjectsApi } from '../../subjects/subjects.api.js'
import { teachersApi } from '../../teachers/teachers.api.js'
import { examsApi } from '../../exams/exams.api.js'
import { sessionOptions } from '../analytics.helpers.js'

const SESSIONS = sessionOptions()

export default function FilterBar({
  filters,
  setFilter,
  showClass, showSection, showSubject, showTeacher, showExam, showPassPercentage,
}) {
  const [customRange, setCustomRange] = useState(!!(filters.startDate || filters.endDate))
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { classes, sectionsOf } = useClasses()
  const { data: subjects } = useFetch(() => subjectsApi.list(), [], { enabled: !!showSubject })
  const { data: teacherData } = useFetch(() => teachersApi.listAll(), [], { enabled: !!showTeacher })
  const { data: examData } = useFetch(() => examsApi.list({ pageSize: 100 }), [], { enabled: !!showExam })

  const sections = filters.classId ? sectionsOf(filters.classId) : []
  const teachers = teacherData ?? []
  const exams = examData?.items ?? []

  const handlePeriodMode = (isCustom) => {
    setCustomRange(isCustom)
    if (isCustom) {
      setFilter('year', '')
    } else {
      setFilter('startDate', '')
      setFilter('endDate', '')
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 mb-6">
      {!customRange ? (
        <label className="block">
          <span className="text-xs font-semibold text-ink/50 mb-1 block">Session</span>
          <select
            className={`${selectClass} w-44`}
            value={filters.year || ''}
            onChange={(e) => {
              if (e.target.value === '__custom') {
                handlePeriodMode(true)
              } else {
                setFilter('year', e.target.value)
              }
            }}
          >
            {SESSIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
            <option value="__custom">Custom range…</option>
          </select>
        </label>
      ) : (
        <div className="flex items-end gap-2">
          <label className="block">
            <span className="text-xs font-semibold text-ink/50 mb-1 block">From</span>
            <input
              type="date"
              className={`${inputClass} w-40`}
              value={filters.startDate || ''}
              onChange={(e) => setFilter('startDate', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink/50 mb-1 block">To</span>
            <input
              type="date"
              className={`${inputClass} w-40`}
              value={filters.endDate || ''}
              onChange={(e) => setFilter('endDate', e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => handlePeriodMode(false)}
            className="p-2.5 text-ink/40 hover:text-ink rounded-lg hover:bg-line/40"
            aria-label="Back to session picker"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showClass && (
        <label className="block">
          <span className="text-xs font-semibold text-ink/50 mb-1 block">Class</span>
          <select className={`${selectClass} w-36`} value={filters.classId || ''} onChange={(e) => setFilter('classId', e.target.value)}>
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}

      {showSection && filters.classId && (
        <label className="block">
          <span className="text-xs font-semibold text-ink/50 mb-1 block">Section</span>
          <select className={`${selectClass} w-36`} value={filters.sectionId || ''} onChange={(e) => setFilter('sectionId', e.target.value)}>
            <option value="">All sections</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}

      {showSubject && (
        <label className="block">
          <span className="text-xs font-semibold text-ink/50 mb-1 block">Subject</span>
          <select className={`${selectClass} w-40`} value={filters.subjectId || ''} onChange={(e) => setFilter('subjectId', e.target.value)}>
            <option value="">All subjects</option>
            {(subjects ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      )}

      {showTeacher && (
        <label className="block">
          <span className="text-xs font-semibold text-ink/50 mb-1 block">Teacher</span>
          <select className={`${selectClass} w-44`} value={filters.teacherId || ''} onChange={(e) => setFilter('teacherId', e.target.value)}>
            <option value="">All teachers</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
      )}

      {showExam && (
        <label className="block">
          <span className="text-xs font-semibold text-ink/50 mb-1 block">Exam</span>
          <select className={`${selectClass} w-44`} value={filters.examId || ''} onChange={(e) => setFilter('examId', e.target.value)}>
            <option value="">All exams</option>
            {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
          </select>
        </label>
      )}

      {showPassPercentage && (
        <div className="relative">
          <Button variant="ghost" size="sm" icon={SlidersHorizontal} onClick={() => setShowAdvanced((v) => !v)}>
            Advanced
          </Button>
          {showAdvanced && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-surface border border-line rounded-xl shadow-pop p-4 w-56">
              <label className="block">
                <span className="text-xs font-semibold text-ink/50 mb-1 block">Pass percentage</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={`${inputClass} w-20`}
                    value={filters.passPercentage ?? 33}
                    onChange={(e) => setFilter('passPercentage', e.target.value)}
                  />
                  <span className="text-sm text-ink/50">%</span>
                </div>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
