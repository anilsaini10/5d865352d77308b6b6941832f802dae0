import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const FILTER_KEYS = ['year', 'startDate', 'endDate', 'classId', 'sectionId', 'subjectId', 'teacherId', 'examId', 'passPercentage']

export function useAnalyticsFilters(allowedKeys = FILTER_KEYS) {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => {
    const f = {}
    for (const key of allowedKeys) {
      const v = searchParams.get(key)
      if (v) f[key] = v
    }
    return f
  }, [searchParams, allowedKeys])

  const setFilter = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === '' || value == null) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
      if (key === 'classId') {
        next.delete('sectionId')
      }
      if (key === 'year') {
        next.delete('startDate')
        next.delete('endDate')
      }
      if (key === 'startDate' || key === 'endDate') {
        next.delete('year')
      }
      return next
    }, { replace: true })
  }, [setSearchParams])

  const setFilters = useCallback((updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value === '' || value == null) next.delete(key)
        else next.set(key, value)
      }
      return next
    }, { replace: true })
  }, [setSearchParams])

  const queryParams = useMemo(() => {
    const q = { ...filters }
    if (!q.year && !q.startDate) delete q.year
    return q
  }, [filters])

  return { filters, setFilter, setFilters, queryParams }
}
