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
 * @typedef {Object} Paper
 * @property {string} id
 * @property {string} examId
 * @property {string} classId
 * @property {string} className
 * @property {string} subjectId
 * @property {string} subjectName
 * @property {string} date  "YYYY-MM-DD"
 * @property {string} startTime  "HH:MM"
 * @property {string} endTime  "HH:MM"
 * @property {number} maxMarks
 * @property {string|null} roomNo
 * @property {{id:string, name:string}|null} invigilator
 * @property {number} [markedCount]  only on the schedule list
 */

/**
 * @typedef {Object} PaperMarks
 * @property {Paper} paper
 * @property {{totalStudents:number, graded:number, absent:number, pending:number}} summary
 * @property {{studentId:string, name:string, admissionNo:string, rollNo:number|null, sectionId:string, sectionName:string,
 *   mark:{id:string, marksObtained:number|null, grade:string|null, remarks:string|null, status:'PENDING'|'GRADED'|'ABSENT'}|null}[]} items
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

  /** Cascades the exam's class assignments, date sheet and marks. */
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

  /** 409 EXAM_CLASS_HAS_SCHEDULE */
  removeClass(examId, classId) {
    return httpClient.delete(`/admin/exams/${examId}/classes/${classId}`).then(unwrap)
  },

  // ── Date sheet (papers) ──────────────────────────────────────────────

  /** @returns {Promise<{exam:{id:string,title:string,startDate:string|null,endDate:string|null}, items:Paper[]}>} */
  listSchedule(examId, { classId } = {}) {
    return httpClient.get(`/admin/exams/${examId}/schedule`, { params: params({ classId }) }).then(unwrap)
  },

  /** body: { classId, subjectId, date, startTime, endTime, maxMarks?, roomNo?, invigilatorId? } */
  createPaper(examId, body) {
    return httpClient.post(`/admin/exams/${examId}/schedule`, body).then(unwrap)
  },

  /** All-or-nothing. On failure `details.paperIndex` (0-based) names the bad row. @returns {Promise<{items:Paper[]}>} */
  createPapersBulk(examId, papers) {
    return httpClient.post(`/admin/exams/${examId}/schedule/bulk`, { papers }).then(unwrap)
  },

  /** Any paper field; `roomNo` / `invigilatorId` accept null to clear. */
  updatePaper(examId, scheduleId, body) {
    return httpClient.patch(`/admin/exams/${examId}/schedule/${scheduleId}`, body).then(unwrap)
  },

  /** 409 EXAM_SCHEDULE_HAS_MARKS */
  removePaper(examId, scheduleId) {
    return httpClient.delete(`/admin/exams/${examId}/schedule/${scheduleId}`).then(unwrap)
  },

  // ── Marks for one paper ──────────────────────────────────────────────

  /** @returns {Promise<PaperMarks>} */
  paperStudents(examId, scheduleId, { sectionId, search } = {}) {
    return httpClient
      .get(`/admin/exams/${examId}/schedule/${scheduleId}/students`, { params: params({ sectionId, search }) })
      .then(unwrap)
  },

  /** marks: [{ studentId, status, marksObtained?, grade?, remarks? }] (1–300). @returns {Promise<PaperMarks & {savedCount:number}>} */
  savePaperMarks(examId, scheduleId, marks) {
    return httpClient.put(`/admin/exams/${examId}/schedule/${scheduleId}/marks`, { marks }).then(unwrap)
  },
}
