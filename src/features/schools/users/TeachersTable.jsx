import { Badge, Table, THead, Th, Tr, Td } from '../../../components/ui.jsx'
import { formatDate, experienceLabel, formatCurrency } from '../../../utils/format.js'

export default function TeachersTable({ items }) {
  return (
    <Table>
      <THead>
        <Th>Emp. ID</Th>
        <Th>Name</Th>
        <Th>Email</Th>
        <Th>Phone</Th>
        <Th>Subjects</Th>
        <Th>Class Teacher</Th>
        <Th>Qualification</Th>
        <Th>Experience</Th>
        <Th>Salary</Th>
        <Th>Performance</Th>
        <Th>Status</Th>
      </THead>
      <tbody>
        {items.map((t) => (
          <Tr key={t.id}>
            <Td className="font-mono text-xs text-ink/55">{t.employeeId || '—'}</Td>
            <Td className="font-semibold text-ink">{t.name}</Td>
            <Td>{t.email || '—'}</Td>
            <Td>{t.phone || '—'}</Td>
            <Td>
              {t.subjectsTaught?.length
                ? t.subjectsTaught.join(', ')
                : t.subjects?.length
                  ? t.subjects.map((s) => s.name).join(', ')
                  : '—'}
            </Td>
            <Td>
              {t.classTeacherOf?.length
                ? t.classTeacherOf.map((c) => `${c.className} – ${c.sectionName}`).join(', ')
                : '—'}
            </Td>
            <Td>{t.qualification || '—'}</Td>
            <Td>{experienceLabel(t.experienceYears, t.experienceMonths)}</Td>
            <Td>{t.salary != null ? formatCurrency(t.salary) : '—'}</Td>
            <Td>{t.performanceScore != null ? `${t.performanceScore}%` : '—'}</Td>
            <Td><Badge tone={t.status === 'ACTIVE' ? 'active' : 'inactive'}>{t.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge></Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}
