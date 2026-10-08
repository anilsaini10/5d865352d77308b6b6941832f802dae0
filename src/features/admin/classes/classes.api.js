import { httpClient } from '../../../api/httpClient.js'
import { unwrap } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} Section
 * @property {string} id
 * @property {string} name
 * @property {string} classId
 * @property {string|null} classTeacherId
 * @property {string|null} classTeacherName
 * @property {number} capacity
 * @property {number} studentCount  active students only
 */

/**
 * @typedef {Object} SchoolClass
 * @property {string} id
 * @property {string} name
 * @property {number} numericLevel
 * @property {number} totalStudents  active students only
 * @property {Section[]} sections
 * @property {{id:string, name:string}[]} subjects
 */

export const classesApi = {
  /** All classes with sections + subjects. Unpaginated (small dataset). @returns {Promise<SchoolClass[]>} */
  list() {
    return httpClient.get('/classes').then(unwrap)
  },

  /** body: { name, numericLevel, sections: [{ name, capacity }] } — 409 CLASS_NAME_TAKEN / SECTION_NAME_TAKEN */
  create(body) {
    return httpClient.post('/classes', body).then(unwrap)
  },

  /** body: { name?, numericLevel? } */
  update(classId, body) {
    return httpClient.patch(`/classes/${classId}`, body).then(unwrap)
  },

  /** 409 CLASS_HAS_STUDENTS if any (even soft-deleted) students exist. */
  remove(classId) {
    return httpClient.delete(`/classes/${classId}`).then(unwrap)
  },

  /** body: { name, capacity } — 409 SECTION_NAME_TAKEN */
  addSection(classId, body) {
    return httpClient.post(`/classes/${classId}/sections`, body).then(unwrap)
  },

  /**
   * body: { name?, capacity?, classTeacherId? } — pass classTeacherId: null to
   * remove the class teacher. 409 TEACHER_ALREADY_CLASS_TEACHER.
   */
  updateSection(classId, sectionId, body) {
    return httpClient.patch(`/classes/${classId}/sections/${sectionId}`, body).then(unwrap)
  },

  /** 409 SECTION_HAS_STUDENTS */
  removeSection(classId, sectionId) {
    return httpClient.delete(`/classes/${classId}/sections/${sectionId}`).then(unwrap)
  },

  /** Link an existing subject to this class's curriculum. Idempotent. */
  linkSubject(classId, subjectId) {
    return httpClient.post(`/classes/${classId}/subjects`, { subjectId }).then(unwrap)
  },
}
