import { useFetch } from '../../../../hooks/useFetch.js'
import { subjectsApi } from '../../subjects/subjects.api.js'

/** All school subjects ([{ id, name }]) plus a sorted, de-duplicated list of names. */
export function useSubjects() {
  const { data, loading, error } = useFetch(() => subjectsApi.list(), [], { errorMessage: 'Could not load subjects.' })
  const subjects = Array.isArray(data) ? data : data?.items ?? []
  const names = [...new Set(subjects.map((s) => s.name).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  return { subjects, names, loading, error }
}
