import { Badge, Table, THead, Th, Tr, Td } from '../../../components/ui.jsx'
import { formatDate } from '../../../utils/format.js'

export default function StudentsTable({ items }) {
  return (
    <Table>
      <THead>
        <Th>Adm. No</Th>
        <Th>Name</Th>
        <Th>Class</Th>
        <Th>Roll</Th>
        <Th>Gender</Th>
        <Th>Parent</Th>
        <Th>Phone</Th>
        <Th>Attendance</Th>
        <Th>Status</Th>
      </THead>
      <tbody>
        {items.map((s) => (
          <Tr key={s.id}>
            <Td className="font-mono text-xs text-ink/55">{s.admissionNo || '—'}</Td>
            <Td className="font-semibold text-ink">{s.name}</Td>
            <Td>{s.className ? `${s.className}${s.sectionName ? ` – ${s.sectionName}` : ''}` : '—'}</Td>
            <Td>{s.rollNo ?? '—'}</Td>
            <Td>{s.gender ? s.gender.charAt(0) + s.gender.slice(1).toLowerCase() : '—'}</Td>
            <Td>{s.parentName || '—'}</Td>
            <Td>{s.parentPhone || '—'}</Td>
            <Td>{s.attendancePercentage != null ? `${s.attendancePercentage}%` : '—'}</Td>
            <Td><Badge tone={s.status === 'ACTIVE' ? 'active' : 'inactive'}>{s.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge></Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}
