/** Lists aren't paginated, but tolerate an { items } / { data } wrapper. */
export function toList(payload) {
  if (Array.isArray(payload)) return payload
  return payload?.items ?? payload?.data ?? []
}

/** Inclusive number of calendar days between two dates. */
export function leaveDays(from, to) {
  const start = new Date(String(from).slice(0, 10))
  const end = new Date(String(to || from).slice(0, 10))
  const days = Math.round((end - start) / 86400000) + 1
  return Number.isFinite(days) && days > 0 ? days : 1
}
