import { useFetch } from '../../../hooks/useFetch.js'
import { academicSessionsApi } from './academicSessions.api.js'

export function useAcademicSessions() {
  const { data, loading, error, reload } = useFetch(() => academicSessionsApi.list(), [], {
    errorMessage: 'Could not load academic sessions.',
  })
  const sessions = Array.isArray(data) ? data : []
  return { sessions, loading, error, reload }
}
