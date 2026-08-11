import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Users as UsersIcon, Mail, Phone, ShieldCheck } from 'lucide-react'
import AppShell from '../components/AppShell.jsx'
import { Badge, Modal, ConfirmDialog, EmptyState, Field, inputClass } from '../components/ui.jsx'
import { useData } from '../context/DataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const emptyForm = { name: '', email: '', phone: '', role: 'School Admin', schoolId: '', status: 'invited' }

function AdminForm({ initial, schools, onCancel, onSave }) {
  const [form, setForm] = useState(initial || emptyForm)
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const err = {}
    if (!form.name.trim()) err.name = 'Naam zaroori hai.'
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Valid email daalein.'
    if (form.role === 'School Admin' && !form.schoolId) err.schoolId = 'School select karein.'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({ ...form, schoolId: form.role === 'Super Admin' ? null : form.schoolId })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name" required error={errors.name}>
          <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Priya Verma" />
        </Field>
        <Field label="Email" required error={errors.email}>
          <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="priya@school.edu" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone">
          <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="+91 90123 45678" />
        </Field>
        <Field label="Role">
          <select className={inputClass} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value, schoolId: e.target.value === 'Super Admin' ? '' : f.schoolId }))}>
            <option value="School Admin">School Admin</option>
            <option value="Super Admin">Super Admin</option>
          </select>
        </Field>
      </div>

      {form.role === 'School Admin' && (
        <Field label="Assign to school" required error={errors.schoolId} hint="School admin sirf ek school manage karta hai">
          <select className={inputClass} value={form.schoolId} onChange={set('schoolId')}>
            <option value="">School select karein</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
      )}

      <Field label="Status">
        <div className="flex gap-2 mt-1">
          {['active', 'invited', 'suspended'].map((s) => (
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
          Save admin
        </button>
      </div>
    </form>
  )
}

export default function Admins() {
  const { admins, schools, addAdmin, updateAdmin, deleteAdmin } = useData()
  const { notify } = useToast()

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const schoolName = (id) => schools.find((s) => s.id === id)?.name

  const filtered = useMemo(() => {
    return admins.filter((a) => {
      const matchesQuery =
        !query || [a.name, a.email, schoolName(a.schoolId) || ''].join(' ').toLowerCase().includes(query.toLowerCase())
      const matchesRole = roleFilter === 'all' || a.role === roleFilter
      return matchesQuery && matchesRole
    })
  }, [admins, query, roleFilter, schools])

  const handleSave = (data) => {
    if (modal?.mode === 'edit') {
      updateAdmin(modal.admin.id, data)
      notify(`${data.name} update ho gaya.`, 'success')
    } else {
      addAdmin(data)
      notify(`${data.name} ko admin bana diya gaya.`, 'success')
    }
    setModal(null)
  }

  return (
    <AppShell
      title="Admins"
      subtitle="Admins create karein aur schools assign karein"
      actions={
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="flex items-center gap-1.5 bg-board hover:bg-board-light text-paper text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} /> New admin
        </button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Naam, email ya school se search karein..."
            className={`${inputClass} pl-10`}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {['all', 'Super Admin', 'School Admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-2.5 rounded-lg text-sm font-semibold border transition-colors whitespace-nowrap ${
                roleFilter === r ? 'bg-board text-paper border-board' : 'border-line text-ink/60 hover:bg-line/40 bg-white'
              }`}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-line rounded-2xl shadow-card">
          <EmptyState
            icon={UsersIcon}
            title={admins.length === 0 ? 'Koi admin nahi hai' : 'Kuch nahi mila'}
            message={admins.length === 0 ? 'Pehla admin add karke schools assign karein.' : 'Search ya filter badal kar dekhein.'}
            action={
              admins.length === 0 && (
                <button onClick={() => setModal({ mode: 'create' })} className="flex items-center gap-1.5 bg-board text-paper text-sm font-semibold px-4 py-2.5 rounded-lg">
                  <Plus size={16} /> Add admin
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="bg-white border border-line rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-line/20 text-left">
                  <th className="px-5 py-3 font-semibold text-ink/60 text-xs uppercase tracking-wide">Admin</th>
                  <th className="px-5 py-3 font-semibold text-ink/60 text-xs uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 font-semibold text-ink/60 text-xs uppercase tracking-wide">Assigned school</th>
                  <th className="px-5 py-3 font-semibold text-ink/60 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 font-semibold text-ink/60 text-xs uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-line/10 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-board/8 text-board font-display font-semibold flex items-center justify-center text-sm shrink-0">
                          {a.name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink truncate">{a.name}</p>
                          <p className="text-xs text-ink/50 flex items-center gap-1 truncate"><Mail size={11} />{a.email}</p>
                          {a.phone && <p className="text-xs text-ink/40 flex items-center gap-1"><Phone size={11} />{a.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-ink/75 font-medium">
                        {a.role === 'Super Admin' && <ShieldCheck size={14} className="text-board" />}
                        {a.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {a.schoolId ? (
                        <span className="text-ink/75">{schoolName(a.schoolId) || 'Unknown school'}</span>
                      ) : (
                        <span className="text-ink/35 italic">
                          {a.role === 'Super Admin' ? 'All schools' : 'Unassigned'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={a.status}>{a.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal({ mode: 'edit', admin: a })}
                          className="p-2 rounded-lg text-ink/50 hover:text-ink hover:bg-line/50 transition-colors"
                          aria-label={`Edit ${a.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="p-2 rounded-lg text-ink/50 hover:text-coral hover:bg-coral/8 transition-colors"
                          aria-label={`Delete ${a.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit admin' : 'Create admin'}
        subtitle={modal?.mode === 'edit' ? modal.admin?.name : 'Naya admin banayein aur school assign karein'}
        wide
      >
        {modal && (
          <AdminForm
            initial={modal.mode === 'edit' ? modal.admin : undefined}
            schools={schools}
            onCancel={() => setModal(null)}
            onSave={handleSave}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteAdmin(deleteTarget.id)
          notify(`${deleteTarget.name} delete ho gaya.`, 'error')
        }}
        title="Admin delete karein?"
        message={`"${deleteTarget?.name}" ki access permanently remove ho jayegi.`}
        confirmLabel="Delete admin"
      />
    </AppShell>
  )
}
