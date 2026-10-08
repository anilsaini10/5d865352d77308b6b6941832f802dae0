import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../api/httpClient.js'

/**
 * Runs `fetcher` whenever `deps` change and exposes the result. Stale
 * responses from superseded calls are dropped. `reload()` refetches with the
 * current deps; `setData` lets callers patch the result after a mutation.
 *
 *   const { data, loading, error, reload } = useFetch(() => api.list({ page }), [page])
 */
export function useFetch(fetcher, deps = [], { errorMessage = 'Could not load data.', enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError('')

    Promise.resolve(fetcherRef.current())
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, errorMessage))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { data, setData, loading, error, reload }
}
