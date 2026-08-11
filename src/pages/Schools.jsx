import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, School as SchoolIcon, MapPin, Users2 } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Modal, ConfirmDialog, EmptyState, Field, inputClass } from '../components/ui.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB', 'Other']

const emptyForm = {
  name: '', code: '', board: 'CBSE', city: '', state: '', students: '',
  principalName: '', contactEmail: '', contactPhone: '', status: 'active',
}

function SchoolForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial || emptyForm)
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const err = {}
    if (!form.name.trim()) err.name = 'School ka naam zaroori hai.'
    if (!form.code.trim()) err.code = 'School code zaroori hai.'
    if (!form.city.trim()) err.city = 'City zaroori hai.'
    if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) err.contactEmail = 'Valid email daalein.'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({ ...form, students: Number(form.students) || 0 })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="School name" required error={errors.name}>
          <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Sunrise Public School" />
        </Field>
        <Field label="School code" required error={errors.code} hint="Unique identifier">
          <input className={inputClass} value={form.code} onChange={set('code')} placeholder="SPS-001" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Board">
          <select className={inputClass} value={form.board} onChange={set('board')}>
            {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="City" required error={errors.city}>
          <input className={inputClass} value={form.city} onChange={set('city')} placeholder="Jaipur" />
        </Field>
        <Field label="State">
          <input className={inputClass} value={form.state} onChange={set('state')} placeholder="Rajasthan" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Principal name">
          <input className={inputClass} value={form.principalName} onChange={set('principalName')} placeholder="Meera Kapoor" />
        </Field>
        <Field label="No. of students">
          <input type="number" min="0" className={inputClass} value={form.students} onChange={set('students')} placeholder="842" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Contact email" error={errors.contactEmail}>
          <input type="email" className={inputClass} value={form.contactEmail} onChange={set('contactEmail')} placeholder="contact@school.edu" />
        </Field>
        <Field label="Contact phone">
          <input className={inputClass} value={form.contactPhone} onChange={set('contactPhone')} placeholder="+91 98765 43210" />
        </Field>
      </div>

      <Field label="Status">
        <div className="flex gap-2 mt-1">
          {['active', 'inactive'].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setForm((f) => ({ ...f, status: s }))}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold border capitalize transition-colors ${
                form.status === s ? 'bg-board text-paper border-board' : 'border-line text-ink/60 hover:bg-line/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink/70 hover:bg-line/50 transition-colors">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-board hover:bg-board-light text-paper transition-colors">
          Save school
        </button>
      </div>
    </form>
  )
}

export default function Schools() {
  const { schools, addSchool, updateSchool, deleteSchool } = useData()
  const { notify } = useToast()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null) // { mode: 'create' | 'edit', school? }
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => {
    return schools.filter((s) => {
      const matchesQuery =
        !query ||
        [s.name, s.code, s.city, s.state].join(' ').toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [schools, query, statusFilter])

  const handleSave = (data) => {
    if (modal?.mode === 'edit') {
      updateSchool(modal.school.id, data)
      notify(`${data.name} update ho gaya.`, 'success')
    } else {
      addSchool(data)
      notify(`${data.name} add ho gaya.`, 'success')
    }
    setModal(null)
  }

  return (
    <AppShell
      title="Schools"
      subtitle="Schools create, edit aur manage karein"
      actions={
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="flex items-center gap-1.5 bg-board hover:bg-board-light text-paper text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} /> New school
        </button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Naam, code ya city se search karein..."
            className={`${inputClass} pl-10`}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {['all', 'active', 'inactive'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2.5 rounded-lg text-sm font-semibold capitalize border transition-colors ${
                statusFilter === s ? 'bg-board text-paper border-board' : 'border-line text-ink/60 hover:bg-line/40 bg-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl shadow-card">
          <EmptyState
            icon={SchoolIcon}
            title={schools.length === 0 ? 'Koi school nahi hai' : 'Kuch nahi mila'}
            message={schools.length === 0 ? 'Apna pehla school add karke shuru karein.' : 'Search ya filter badal kar dekhein.'}
            action={
              schools.length === 0 && (
                <button onClick={() => setModal({ mode: 'create' })} className="flex items-center gap-1.5 bg-board text-paper text-sm font-semibold px-4 py-2.5 rounded-lg">
                  <Plus size={16} /> Add school
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="animate-rise bg-white border border-line rounded-2xl shadow-card p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-board/5 flex items-center justify-center shrink-0">
                  <SchoolIcon size={18} className="text-board" />
                </div>
                <Badge tone={s.status}>{s.status}</Badge>
              </div>
              <h3 className="font-display font-semibold text-ink mt-3.5 leading-snug">{s.name}</h3>
              <p className="text-xs text-ink/45 font-mono mt-0.5">{s.code} · {s.board}</p>

              <div className="mt-3 space-y-1.5 text-sm text-ink/60">
                <p className="flex items-center gap-1.5"><MapPin size={13} className="shrink-0" /> {s.city}, {s.state}</p>
                <p className="flex items-center gap-1.5"><Users2 size={13} className="shrink-0" /> {Number(s.students).toLocaleString('en-IN')} students</p>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line">
                <button
                  onClick={() => setModal({ mode: 'edit', school: s })}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-ink/70 hover:bg-line/50 rounded-lg py-2 transition-colors"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(s)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-coral hover:bg-coral/8 rounded-lg py-2 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit school' : 'Create school'}
        subtitle={modal?.mode === 'edit' ? modal.school?.name : 'School ki details bharein'}
        wide
      >
        {modal && (
          <SchoolForm
            initial={modal.mode === 'edit' ? modal.school : undefined}
            onCancel={() => setModal(null)}
            onSave={handleSave}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteSchool(deleteTarget.id)
          notify(`${deleteTarget.name} delete ho gaya.`, 'error')
        }}
        title="School delete karein?"
        message={`"${deleteTarget?.name}" permanently delete ho jayega, aur isse assigned admins unassigned ho jayenge.`}
        confirmLabel="Delete school"
      />
    </AppShell>
  )
}
