export function ExamDeleteMessage({ title }) {
  return (
    <>
      <span className="font-semibold text-ink">{title}</span> will be permanently deleted, along with its class
      assignments and <span className="font-semibold text-ink">all marks and results recorded for it</span>. This can't be undone.
    </>
  )
}
