import { useState } from 'react'
import { CalendarOff } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { AsyncContent, Card, EmptyState, Tabs, selectClass } from '../../../components/ui.jsx'
import { useFetch } from '../../../hooks/useFetch.js'
import { LEAVE_STATUSES } from '../constants.js'
import { useClasses } from '../classes/useClasses.js'
import { leaveApi } from './leave.api.js'
import { toList } from './leave.utils.js'
import LeaveCard from './components/LeaveCard.jsx'
import LeaveReviewModal from './components/LeaveReviewModal.jsx'

const KIND_TABS = [
  { value: 'student', label: 'Student leave' },
  { value: 'teacher', label: 'Teacher leave' },
]

const STATUS_TABS = [{ value: 'ALL', label: 'All' }, ...LEAVE_STATUSES.map(({ value, label }) => ({ value, label }))]

function LeaveList({ kind, status, classId, sectionId }) {
  const [reviewTarget, setReviewTarget] = useState(null)
  const apiStatus = status === 'ALL' ? undefined : status

  const { data, loading, error, reload } = useFetch(
    () => (kind === 'student' ? leaveApi.listStudent({ status: apiStatus, classId, sectionId }) : leaveApi.listTeacher({ status: apiStatus })),
    [kind, apiStatus, classId, sectionId],
    { errorMessage: 'Could not load leave requests.' }
  )
  const leaves = toList(data)

  const statusWord = status === 'ALL' ? '' : `${status.toLowerCase()} `

  return (
    <>
      <Card className="overflow-hidden">
        <AsyncContent
          loading={loading}
          error={error}
          empty={leaves.length === 0}
          emptyState={
            <EmptyState
              icon={CalendarOff}
              title={`No ${statusWord}requests`}
              message={status === 'PENDING' ? 'Nothing is waiting for review.' : 'No leave requests match these filters.'}
            />
          }
        >
          <ul className="divide-y divide-line">
            {leaves.map((l) => (
              <LeaveCard
                key={l.id}
                leave={l}
                title={kind === 'student' ? l.studentName : l.teacherName}
                subtitle={
                  kind === 'student'
                    ? [l.className && `${l.className}${l.sectionName ? ` – ${l.sectionName}` : ''}`, l.appliedBy?.name && `Applied by ${l.appliedBy.name}`]
                        .filter(Boolean)
                        .join(' · ')
                    : undefined
                }
                onReview={(next) => setReviewTarget({ leave: l, kind, status: next })}
              />
            ))}
          </ul>
        </AsyncContent>
      </Card>

      <LeaveReviewModal target={reviewTarget} onClose={() => setReviewTarget(null)} onReviewed={reload} />
    </>
  )
}

export default function LeavePage() {
  const [kind, setKind] = useState('student')
  const [status, setStatus] = useState('ALL')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const { classes, sectionsOf } = useClasses()

  const changeClass = (id) => {
    setClassId(id)
    setSectionId('')
  }

  return (
    <AppShell title="Leave requests" subtitle="Review leave applied by parents and teachers">
      <div className="overflow-x-auto mb-4">
        <Tabs options={KIND_TABS} value={kind} onChange={setKind} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="overflow-x-auto shrink-0">
          <Tabs options={STATUS_TABS} value={status} onChange={setStatus} />
        </div>
        {kind === 'student' && (
          <>
            <select className={`${selectClass} sm:w-44`} value={classId} onChange={(e) => changeClass(e.target.value)} aria-label="Filter by class">
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className={`${selectClass} sm:w-44`}
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={!classId}
              aria-label="Filter by section"
            >
              <option value="">All sections</option>
              {sectionsOf(classId).map((s) => (
                <option key={s.id} value={s.id}>Section {s.name}</option>
              ))}
            </select>
          </>
        )}
      </div>

      <LeaveList
        key={kind}
        kind={kind}
        status={status}
        classId={kind === 'student' ? classId : ''}
        sectionId={kind === 'student' ? sectionId : ''}
      />
    </AppShell>
  )
}
