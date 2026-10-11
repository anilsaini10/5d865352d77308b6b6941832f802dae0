export function ExamDeleteMessage({ title }) {
  return (
    <>
      <span className="font-semibold text-ink">{title}</span> will be permanently deleted, along with its class
      assignments, its <span className="font-semibold text-ink">date sheet and all marks recorded for it</span>. This can't be undone.
    </>
  )
}
