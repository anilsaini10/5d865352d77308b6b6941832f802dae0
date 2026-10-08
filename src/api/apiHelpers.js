import { cleanParams } from '../utils/format.js'

export const unwrap = (res) => res.data.data

/**
 * Paginated endpoints return their rows under `items` (or occasionally
 * `data`) alongside page metadata — normalise to one shape so list pages
 * don't care which. Any extra top-level fields (e.g. `maxMarks`) are kept.
 */
export function normalizePage(payload) {
  const { items, data, page = 1, pageSize, total, totalPages, ...rest } = payload ?? {}
  const rows = items ?? data ?? []
  return {
    ...rest,
    items: rows,
    page,
    pageSize,
    total: total ?? rows.length,
    totalPages: totalPages || 1,
  }
}

export const params = cleanParams
