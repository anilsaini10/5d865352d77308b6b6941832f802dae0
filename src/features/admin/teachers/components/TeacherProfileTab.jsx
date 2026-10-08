import { Badge, Card } from '../../../../components/ui.jsx'
import { experienceLabel, formatCurrency, formatDate } from '../../../../utils/format.js'
import { GENDERS, enumMeta } from '../../constants.js'

function Item({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</dt>
      <dd className="text-sm text-ink mt-1 break-words">{children ?? '—'}</dd>
    </div>
  )
}

export default function TeacherProfileTab({ teacher }) {
  const active = teacher.status !== 'INACTIVE'
  const score = teacher.performanceScore

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-5 lg:col-span-2">
        <h3 className="font-display font-semibold text-ink mb-4">Details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <Item label="Employee ID">{teacher.employeeId}</Item>
          <Item label="Status">
            <Badge tone={active ? 'active' : 'inactive'}>{active ? 'Active' : 'Deleted'}</Badge>
          </Item>
          <Item label="Email (login)">{teacher.email}</Item>
          <Item label="Phone">{teacher.phone}</Item>
          <Item label="Gender">{teacher.gender ? enumMeta(GENDERS, teacher.gender).label : null}</Item>
          <Item label="Joining date">{formatDate(teacher.joiningDate)}</Item>
          <Item label="Qualification">{teacher.qualification}</Item>
          <Item label="Experience">{experienceLabel(teacher.experienceYears, teacher.experienceMonths)}</Item>
          <Item label="Monthly salary">{formatCurrency(teacher.salary)}</Item>
        </dl>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink">Performance score</h3>
          {score == null ? (
            <p className="text-sm text-ink/50 mt-2">Not available yet.</p>
          ) : (
            <>
              <p className="font-display text-3xl font-semibold text-board mt-2">{Number(score).toFixed(score % 1 ? 1 : 0)}</p>
              {score <= 100 && (
                <div className="h-2 rounded-full bg-line/60 mt-3 overflow-hidden">
                  <div className="h-full bg-board rounded-full" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
                </div>
              )}
            </>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink">Class teacher of</h3>
          {teacher.classTeacherOf?.length ? (
            <ul className="mt-2 space-y-1.5">
              {teacher.classTeacherOf.map((c) => (
                <li key={c.sectionId} className="text-sm text-ink">
                  {c.className} – Section {c.sectionName}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/50 mt-2">Not a class teacher.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink">Subject expertise</h3>
          {teacher.subjectsTaught?.length ? (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {teacher.subjectsTaught.map((s) => (
                <span key={s} className="rounded-full bg-board/10 border border-board/20 text-board px-2.5 py-0.5 text-xs font-semibold">{s}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink/50 mt-2">None listed.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
