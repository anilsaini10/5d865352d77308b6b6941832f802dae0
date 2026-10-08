import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} Exam
 * @property {string} id
 * @property {string} title
 * @property {string|null} description
 * @property {string|null} startDate
 * @property {string|null} endDate
 * @property {{classId:string, className:string, maxMarks:number}[]} classes
 * @property {{id:string, name:string}} createdBy
 */

/**
 * @typedef {Object} ExamClassProgress
 * @property {string} classId
 * @property {string} className
 * @property {number} maxMarks
 * @property {number} studentCount
 * @property {number} gradedCount
 */

/**
 * @typedef {Object} ExamResult
 * @property {string} id
 * @property {number|null} marksObtained
 * @property {string|null} grade
 * @property {string|null} remarks
 * @property {'PENDING'|'GRADED'|'ABSENT'} status
 */

export const examsApi = {
  list({ page = 1, pageSize = 15, search } = {}) {
    return httpClient.get('/admin/exams', { params: params({ page, pageSize, search }) }).then(unwrap).then(normalizePage)
  },

  /** @returns {Promise<Exam>} */
  get(examId) {
    return httpClient.get(`/admin/exams/${examId}`).then(unwrap)
  },

  /** body: { title, description?, startDate?, endDate?, classes: [{ classId, maxMarks }] } */
  create(body) {
    return httpClient.post('/admin/exams', body).then(unwrap)
  },

  /** title / description / dates only — classes go through the class endpoints. */
  update(examId, body) {
    return httpClient.patch(`/admin/exams/${examId}`, body).then(unwrap)
  },

  /** Cascades the exam's class assignments and results. */
  remove(examId) {
    return httpClient.delete(`/admin/exams/${examId}`).then(unwrap)
  },

  /** @returns {Promise<ExamClassProgress[]>} */
  listClasses(examId) {
    return httpClient.get(`/admin/exams/${examId}/classes`).then(unwrap)
  },

  /** body: { classId, maxMarks } — 409 EXAM_CLASS_ALREADY_ASSIGNED */
  addClass(examId, body) {
    return httpClient.post(`/admin/exams/${examId}/classes`, body).then(unwrap)
  },

  /** 409 EXAM_CLASS_HAS_RESULTS */
  removeClass(examId, classId) {
    return httpClient.delete(`/admin/exams/${examId}/classes/${classId}`).then(unwrap)
  },

  /**
   * @returns {Promise<{maxMarks:number, items:{studentId:string, name:string, admissionNo:string, rollNo:number, result:ExamResult|null}[], page:number, total:number, totalPages:number}>}
   */
  classStudents(examId, classId, { page = 1, pageSize = 50, search } = {}) {
    return httpClient
      .get(`/admin/exams/${examId}/classes/${classId}/students`, { params: params({ page, pageSize, search }) })
      .then(unwrap)
      .then(normalizePage)
  },

  /** body: { studentId, marksObtained?, grade?, remarks?, status } — 400 INVALID_MARKS */
  createResult(examId, body) {
    return httpClient.post(`/admin/exams/${examId}/results`, body).then(unwrap)
  },

  getResult(examId, resultId) {
    return httpClient.get(`/admin/exams/${examId}/results/${resultId}`).then(unwrap)
  },

  updateResult(examId, resultId, body) {
    return httpClient.patch(`/admin/exams/${examId}/results/${resultId}`, body).then(unwrap)
  },

  removeResult(examId, resultId) {
    return httpClient.delete(`/admin/exams/${examId}/results/${resultId}`).then(unwrap)
  },
}
