import { useState } from 'react'
import { ClipboardCheck, ClipboardList } from 'lucide-react'
import { AsyncContent, Badge, Button, Card, EmptyState, Table, THead, Th, Tr, Td } from '../../../../components/ui.jsx'
import GradingProgress from './GradingProgress.jsx'
import PaperMarksPanel from './PaperMarksPanel.jsx'
import { byDateTime, formatPaperDate, formatPaperTime, isFutureDate } from './scheduleUtils.js'

/** Lists the exam's papers with marking progress; opening one shows its marks grid. */
export default function MarksTab({ examId, examClasses, classes, papers, loading, error, reload, openPaperId, onOpenPaper }) {
  const [classId, setClassId] = useState('')
  const open = papers.find((p) => p.id === openPaperId)

  if (open) {
    return (
      <PaperMarksPanel
        examId={examId}
        paper={open}
        classes={classes}
        onBack={() => { onOpenPaper(null); reload() }}
        onChanged={reload}
        onStale={() => { onOpenPaper(null); reload() }}
      />
    )
  }

  const studentCount = (cid) => examClasses.find((c) => c.classId === cid)?.studentCount ?? 0
  const visible = papers.filter((p) => !classId || p.classId === classId).sort(byDateTime)

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select aria-label="Filter by class" className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-board" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">All classes</option>
          {examClasses.map((c) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
        </select>
      </div>

      <Card>
        <AsyncContent
          loading={loading && papers.length === 0}
          error={error}
          empty={visible.length === 0}
          emptyState={<EmptyState icon={ClipboardList} title="No papers to mark" message="Build the date sheet first — marks are entered paper by paper." />}
        >
          <Table>
            <THead>
              <Th>Date</Th><Th>Class</Th><Th>Subject</Th><Th>Max marks</Th><Th>Progress</Th><Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {visible.map((p) => {
                const future = isFutureDate(p.date)
                return (
                  <Tr key={p.id} className="hover:bg-line/20 cursor-pointer" onClick={() => onOpenPaper(p.id)}>
                    <Td className="whitespace-nowrap">
                      <p className="font-medium text-ink">{formatPaperDate(p.date, { weekday: true })}</p>
                      <p className="text-xs text-ink/45">{formatPaperTime(p)}</p>
                    </Td>
                    <Td className="font-semibold text-ink whitespace-nowrap">{p.className}</Td>
                    <Td className="whitespace-nowrap">{p.subjectName}</Td>
                    <Td>{p.maxMarks}</Td>
                    <Td className="min-w-[200px]">
                      {future ? <Badge tone="neutral">Not held yet</Badge> : <GradingProgress graded={p.markedCount ?? 0} total={studentCount(p.classId)} label="marked" />}
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <Button size="sm" variant="secondary" icon={ClipboardCheck} onClick={(e) => { e.stopPropagation(); onOpenPaper(p.id) }}>
                        {future ? 'View' : 'Marks'}
                      </Button>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        </AsyncContent>
      </Card>
      <p className="text-xs text-ink/50 mt-3">Teachers enter marks for their own sections from the teacher app. Changes here override theirs. Parents see marks as soon as they’re saved.</p>
    </>
  )
}
