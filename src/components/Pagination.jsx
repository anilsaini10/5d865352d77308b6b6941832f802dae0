import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, total, onChange }) {
  if (total === 0) return null

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <p className="text-sm text-ink/55">
        Page <span className="font-semibold text-ink">{page}</span> of{' '}
        <span className="font-semibold text-ink">{totalPages}</span> · {total} total
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold border border-line text-ink/70 hover:bg-line/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={15} /> Prev
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold border border-line text-ink/70 hover:bg-line/40 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
