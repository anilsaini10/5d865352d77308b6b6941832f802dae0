import { Badge, Table, THead, Th, Tr, Td } from '../../../components/ui.jsx'
import { formatDate, experienceLabel, formatCurrency } from '../../../utils/format.js'

export default function StaffTable({ items }) {
  return (
    <Table>
      <THead>
        <Th>Emp. ID</Th>
        <Th>Name</Th>
        <Th>Email</Th>
        <Th>Phone</Th>
        <Th>Designation</Th>
        <Th>Role</Th>
        <Th>Qualification</Th>
        <Th>Experience</Th>
        <Th>Salary</Th>
        <Th>Joined</Th>
        <Th>Status</Th>
      </THead>
      <tbody>
        {items.map((s) => (
          <Tr key={s.id}>
            <Td className="font-mono text-xs text-ink/55">{s.employeeId || '—'}</Td>
            <Td className="font-semibold text-ink">{s.name}</Td>
            <Td>{s.email || '—'}</Td>
            <Td>{s.phone || '—'}</Td>
            <Td>{s.designation || '—'}</Td>
            <Td>{s.customRole?.name || '—'}</Td>
            <Td>{s.qualification || '—'}</Td>
            <Td>{experienceLabel(s.experienceYears, s.experienceMonths)}</Td>
            <Td>{s.salary != null ? formatCurrency(s.salary) : '—'}</Td>
            <Td>{formatDate(s.joiningDate)}</Td>
            <Td><Badge tone={s.status === 'ACTIVE' ? 'active' : 'inactive'}>{s.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge></Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}
