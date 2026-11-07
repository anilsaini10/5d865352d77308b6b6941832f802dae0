import { httpClient } from '../../../api/httpClient.js'
import { unwrap, normalizePage, params } from '../../../api/apiHelpers.js'

// ── Subjects (extended) ─────────────────────────────────────────

export const subjectsExtApi = {
  getById(subjectId) {
    return httpClient.get(`/subjects/${subjectId}`).then(unwrap)
  },
  update(subjectId, body) {
    return httpClient.patch(`/subjects/${subjectId}`, body).then(unwrap)
  },
  remove(subjectId) {
    return httpClient.delete(`/subjects/${subjectId}`).then(unwrap)
  },
  toggleStatus(subjectId) {
    return httpClient.patch(`/subjects/${subjectId}/status`).then(unwrap)
  },
  assignClasses(subjectId, classIds) {
    return httpClient.post(`/subjects/${subjectId}/classes`, { classIds }).then(unwrap)
  },
  byClass(classId) {
    return httpClient.get(`/subjects/by-class/${classId}`).then(unwrap)
  },
}

// ── Chapters ────────────────────────────────────────────────────

export const chaptersApi = {
  list({ subjectId, classId, isActive, page = 1, pageSize = 50 } = {}) {
    return httpClient
      .get('/admin/syllabus/chapters', { params: params({ subjectId, classId, isActive, page, pageSize }) })
      .then(unwrap)
      .then(normalizePage)
  },

  get(chapterId) {
    return httpClient.get(`/admin/syllabus/chapters/${chapterId}`).then(unwrap)
  },

  create(body) {
    return httpClient.post('/admin/syllabus/chapters', body).then(unwrap)
  },

  update(chapterId, body) {
    return httpClient.patch(`/admin/syllabus/chapters/${chapterId}`, body).then(unwrap)
  },

  remove(chapterId) {
    return httpClient.delete(`/admin/syllabus/chapters/${chapterId}`).then(unwrap)
  },

  toggleStatus(chapterId) {
    return httpClient.patch(`/admin/syllabus/chapters/${chapterId}/status`).then(unwrap)
  },

  reorder(chapters) {
    return httpClient.patch('/admin/syllabus/chapters/reorder', { chapters }).then(unwrap)
  },
}

// ── Syllabus Plans ──────────────────────────────────────────────

export const plansApi = {
  list({ sessionYear, classId, sectionId, subjectId, teacherId, status, page = 1, pageSize = 20 } = {}) {
    return httpClient
      .get('/admin/syllabus/plans', { params: params({ sessionYear, classId, sectionId, subjectId, teacherId, status, page, pageSize }) })
      .then(unwrap)
      .then(normalizePage)
  },

  get(planId) {
    return httpClient.get(`/admin/syllabus/plans/${planId}`).then(unwrap)
  },

  create(body) {
    return httpClient.post('/admin/syllabus/plans', body).then(unwrap)
  },

  update(planId, body) {
    return httpClient.patch(`/admin/syllabus/plans/${planId}`, body).then(unwrap)
  },

  remove(planId) {
    return httpClient.delete(`/admin/syllabus/plans/${planId}`).then(unwrap)
  },

  updateChapter(planId, chapterId, body) {
    return httpClient.patch(`/admin/syllabus/plans/${planId}/chapters/${chapterId}`, body).then(unwrap)
  },
}

// ── Monitoring ──────────────────────────────────────────────────

export const syllabusMonitorApi = {
  dashboard(sessionYear) {
    return httpClient.get('/admin/syllabus/dashboard', { params: { sessionYear } }).then(unwrap)
  },

  classProgress({ sessionYear, classId, subjectId, teacherId } = {}) {
    return httpClient
      .get('/admin/syllabus/reports/class-progress', { params: params({ sessionYear, classId, subjectId, teacherId }) })
      .then(unwrap)
  },

  teacherProgress({ sessionYear, classId, subjectId, teacherId } = {}) {
    return httpClient
      .get('/admin/syllabus/reports/teacher-progress', { params: params({ sessionYear, classId, subjectId, teacherId }) })
      .then(unwrap)
  },

  delayedChapters({ sessionYear, classId, sectionId, subjectId, teacherId } = {}) {
    return httpClient
      .get('/admin/syllabus/reports/delayed-chapters', { params: params({ sessionYear, classId, sectionId, subjectId, teacherId }) })
      .then(unwrap)
  },
}

// ── Approvals ───────────────────────────────────────────────────

export const approvalsApi = {
  list({ sessionYear, classId, subjectId, teacherId } = {}) {
    return httpClient
      .get('/admin/syllabus/approvals', { params: params({ sessionYear, classId, subjectId, teacherId }) })
      .then(unwrap)
  },

  review(approvalId, body) {
    return httpClient.patch(`/admin/syllabus/approvals/${approvalId}`, body).then(unwrap)
  },

  correct(planChapterId, body) {
    return httpClient.patch(`/admin/syllabus/approvals/correct/${planChapterId}`, body).then(unwrap)
  },
}
