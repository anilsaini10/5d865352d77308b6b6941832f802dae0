import { useCallback, useEffect, useState } from 'react'
import { recoveryApi } from './recovery.api.js'
import { RECOVERY_CHANGED_EVENT } from './recovery.constants.js'

const REFRESH_MS = 2 * 60 * 1000

/** Number of PENDING recovery requests (for the sidebar badge). Refetches on `recovery:changed` and every 2 minutes. */
export function useRecoveryPendingCount(enabled) {
  const [count, setCount] = useState(0)

  const load = useCallback(() => {
    recoveryApi
      .list({ status: 'PENDING', page: 1, pageSize: 1 })
      .then((res) => setCount(res.statusCounts?.PENDING ?? 0))
      .catch(() => {}) // badge is best-effort
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    load()
    const timer = setInterval(load, REFRESH_MS)
    window.addEventListener(RECOVERY_CHANGED_EVENT, load)
    return () => {
      clearInterval(timer)
      window.removeEventListener(RECOVERY_CHANGED_EVENT, load)
    }
  }, [enabled, load])

  return count
}
