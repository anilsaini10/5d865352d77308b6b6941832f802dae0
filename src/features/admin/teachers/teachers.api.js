import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} Teacher
 * @property {string} id
 * @property {string} employeeId
 * @property {string} name
 * @property {'MALE'|'FEMALE'|'OTHER'} gender
 * @property {string} email
 * @property {string} phone
 * @property {{subjectId:string, name:string, classId:string, className:string}[]} subjects  subject+class assignments
 * @property {{sectionId:string, sectionName:string, classId:string, className:string}[]} classTeacherOf
 * @property {string} joiningDate
 * @property {number} salary
 * @property {string} qualification
 * @property {number} experienceYears
 * @property {number} experienceMonths
 * @property {string[]} subjectsTaught  general expertise names
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {number|null} performanceScore
 */

export const teachersApi = {
  /** status: undefined → ACTIVE only (backend default), 'INACTIVE', or 'ALL'. */
  list({ page = 1, pageSize = 15, search, subject, classId, status } = {}) {
    return httpClient
      .get('/admin/teachers', { params: params({ page, pageSize, search, subject, classId, status }) })
      .then(unwrap)
      .then(normalizePage)
  },

  /** Every active teacher across all pages — for pickers (class teacher, timetable, attendance). */
  async listAll({ status } = {}) {
    const pageSize = 100
    const first = await this.list({ page: 1, pageSize, status })
    if (first.totalPages <= 1) return first.items
    const rest = await Promise.all(
      Array.from({ length: first.totalPages - 1 }, (_, i) => this.list({ page: i + 2, pageSize, status }))
    )
    return [...first.items, ...rest.flatMap((r) => r.items)]
  },

  /** @returns {Promise<Teacher>} */
  get(teacherId) {
    return httpClient.get(`/admin/teachers/${teacherId}`).then(unwrap)
  },

  /**
   * body: { name, email, phone, gender, salary, qualification, experienceYears,
   * experienceMonths, subjects: string[], joiningDate, classTeacherSectionId? }
   * @returns {Promise<{teacher: Teacher, defaultPassword: string}>}
   * 409 EMAIL_TAKEN, 409 SECTION_ALREADY_HAS_CLASS_TEACHER
   */
  create(body) {
    return httpClient.post('/admin/teachers', body).then(unwrap)
  },

  /** Any create field, plus status, subjectsTaught, classTeacherSectionId. */
  update(teacherId, body) {
    return httpClient.patch(`/admin/teachers/${teacherId}`, body).then(unwrap)
  },

  restore(teacherId) {
    return this.update(teacherId, { status: 'ACTIVE' })
  },

  /** SOFT delete that ALSO disables the teacher's login and revokes their sessions. */
  remove(teacherId) {
    return httpClient.delete(`/admin/teachers/${teacherId}`).then(unwrap)
  },

  /** body: { subject: name, classId } — 409 SUBJECT_ALREADY_ASSIGNED */
  assignSubject(teacherId, body) {
    return httpClient.post(`/admin/teachers/${teacherId}/subjects`, body).then(unwrap)
  },

  /** 409 SUBJECT_ASSIGNMENT_IN_USE when timetable periods still use it. */
  unassignSubject(teacherId, subjectId, classId) {
    return httpClient.delete(`/admin/teachers/${teacherId}/subjects/${subjectId}/${classId}`).then(unwrap)
  },
}
