import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} Student
 * @property {string} id
 * @property {string} admissionNo
 * @property {string} name
 * @property {'MALE'|'FEMALE'|'OTHER'} gender
 * @property {string} dateOfBirth
 * @property {string} classId
 * @property {string} className
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {number} rollNo
 * @property {string} parentName
 * @property {string} parentPhone
 * @property {string} parentEmail
 * @property {string|null} bloodGroup
 * @property {string|null} address
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {number|null} attendancePercentage
 */

export const studentsApi = {
  /** status: undefined → ACTIVE only (backend default), 'INACTIVE', or 'ALL'. */
  list({ page = 1, pageSize = 15, search, classId, sectionId, status } = {}) {
    return httpClient
      .get('/admin/students', { params: params({ page, pageSize, search, classId, sectionId, status }) })
      .then(unwrap)
      .then(normalizePage)
  },

  /** @returns {Promise<Student>} */
  get(studentId) {
    return httpClient.get(`/admin/students/${studentId}`).then(unwrap)
  },

  /**
   * @returns {Promise<{student: Student, parentAccount: {isNew:boolean, email:string, defaultPassword?:string}}>}
   * 409 ROLL_NO_TAKEN (message carries "Next available roll number: N"), 409 EMAIL_TAKEN
   */
  create(body) {
    return httpClient.post('/admin/students', body).then(unwrap)
  },

  /** Any create field, plus status: 'ACTIVE' to restore a soft-deleted student. */
  update(studentId, body) {
    return httpClient.patch(`/admin/students/${studentId}`, body).then(unwrap)
  },

  restore(studentId) {
    return this.update(studentId, { status: 'ACTIVE' })
  },

  /** SOFT delete — status becomes INACTIVE, roll number is freed, parent login untouched. */
  remove(studentId) {
    return httpClient.delete(`/admin/students/${studentId}`).then(unwrap)
  },
}

/** Pulls N out of "...Next available roll number: N" in a ROLL_NO_TAKEN message. */
export function parseSuggestedRollNo(message) {
  const match = /next available roll number:\s*(\d+)/i.exec(message ?? '')
  return match ? Number(match[1]) : null
}
