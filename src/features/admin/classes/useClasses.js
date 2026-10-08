import { useFetch } from '../../../hooks/useFetch.js'
import { classesApi } from './classes.api.js'

/**
 * Loads the school's classes (with sections + subjects) — used by every
 * page that needs a class/section picker. `classes` is [] until loaded.
 */
export function useClasses() {
  const { data, loading, error, reload } = useFetch(() => classesApi.list(), [], {
    errorMessage: 'Could not load classes.',
  })
  const classes = data ?? []
  const sectionsOf = (classId) => classes.find((c) => c.id === classId)?.sections ?? []
  return { classes, sectionsOf, loading, error, reload }
}
