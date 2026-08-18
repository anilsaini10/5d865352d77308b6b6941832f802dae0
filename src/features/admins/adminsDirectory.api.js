import { schoolsApi } from '../schools/schools.api.js'
import { adminsApi } from './admins.api.js'

const SCHOOLS_PAGE_SIZE = 100

async function fetchAllSchools() {
  const first = await schoolsApi.list({ page: 1, pageSize: SCHOOLS_PAGE_SIZE })
  if (first.totalPages <= 1) return first.items

  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) => schoolsApi.list({ page: i + 2, pageSize: SCHOOLS_PAGE_SIZE }))
  )
  return [...first.items, ...rest.flatMap((r) => r.items)]
}

/**
 * There's no single "list all admins" endpoint — admins are only listable
 * per school — so this fetches every school, then every school's admins,
 * and flattens the result with the school name attached to each admin.
 */
export async function fetchAdminsDirectory() {
  const schools = await fetchAllSchools()

  const perSchool = await Promise.all(
    schools.map((school) =>
      adminsApi
        .list(school.id)
        .then((admins) => admins.map((admin) => ({ ...admin, schoolName: school.name })))
        .catch(() => [])
    )
  )

  return { schools, admins: perSchool.flat() }
}
