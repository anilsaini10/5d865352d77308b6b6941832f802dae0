import { useCallback, useEffect, useState } from 'react'
import { supportInboxApi } from './supportInbox.api.js'
import { SUPPORT_CHANGED_EVENT } from './support.constants.js'

const REFRESH_MS = 2 * 60 * 1000

/** Number of OPEN support queries (for the sidebar badge). Refetches on `support:changed` and every 2 minutes. */
export function useSupportOpenCount(enabled) {
  const [count, setCount] = useState(0)

  const load = useCallback(() => {
    supportInboxApi
      .list({ page: 1, pageSize: 1 })
      .then((res) => setCount(res.statusCounts?.OPEN ?? 0))
      .catch(() => {}) // badge is best-effort
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    load()
    const timer = setInterval(load, REFRESH_MS)
    window.addEventListener(SUPPORT_CHANGED_EVENT, load)
    return () => {
      clearInterval(timer)
      window.removeEventListener(SUPPORT_CHANGED_EVENT, load)
    }
  }, [enabled, load])

  return count
}
