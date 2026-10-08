import { ConfirmDialog } from '../../../../components/ui.jsx'

export function DeleteTeacherDialog({ teacher, onClose, onConfirm }) {
  return (
    <ConfirmDialog
      open={!!teacher}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete this teacher?"
      confirmLabel="Delete teacher"
      message={
        <>
          <strong className="text-ink">{teacher?.name}</strong> will be moved to deleted teachers. They will be signed
          out and unable to log in until you restore them. Their records, subject assignments and history are kept.
        </>
      }
    />
  )
}
