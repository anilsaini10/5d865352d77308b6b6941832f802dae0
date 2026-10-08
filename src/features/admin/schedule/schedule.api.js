import { httpClient } from '../../../api/httpClient.js'
import { unwrap, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} ScheduleEntry
 * @property {string} id
 * @property {string} classId
 * @property {string} className
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {string} day  MONDAY..SUNDAY
 * @property {'CLASS_PERIOD'|'BREAK'} type
 * @property {number|null} periodNo  read-only, computed by the backend from time order
 * @property {string|null} subjectId
 * @property {string|null} subjectName
 * @property {string|null} teacherId
 * @property {string|null} teacherName
 * @property {string|null} roomNo
 * @property {string|null} title  for breaks
 * @property {string} startTime  "HH:MM"
 * @property {string} endTime  "HH:MM"
 */

/** @typedef {{ sectionId?:string, sectionName?:string, className?:string, timetable: Record<string, ScheduleEntry[]> }} WeeklyTimetable */

export const scheduleApi = {
  list({ classId, sectionId, day, teacherId } = {}) {
    return httpClient.get('/admin/schedule', { params: params({ classId, sectionId, day, teacherId }) }).then(unwrap)
  },

  /** @returns {Promise<WeeklyTimetable>} */
  forSection(sectionId) {
    return httpClient.get(`/admin/schedule/sections/${sectionId}`).then(unwrap)
  },

  /** @returns {Promise<WeeklyTimetable>} */
  forTeacher(teacherId) {
    return httpClient.get(`/admin/schedule/teachers/${teacherId}`).then(unwrap)
  },

  /**
   * body: { classId, sectionId, day, type, subjectId+teacherId (CLASS_PERIOD),
   * title (BREAK), roomNo?, startTime, endTime }. Never send periodNo.
   * Errors: SECTION_NOT_FOUND, SUBJECT_NOT_ASSIGNED, TIME_OVERLAP_SECTION,
   * TEACHER_TIME_CONFLICT, ROOM_TIME_CONFLICT
   */
  create(body) {
    return httpClient.post('/admin/schedule', body).then(unwrap)
  },

  /** classId / sectionId / type are immutable. Can renumber other periods — refetch afterwards. */
  update(scheduleId, body) {
    return httpClient.patch(`/admin/schedule/${scheduleId}`, body).then(unwrap)
  },

  remove(scheduleId) {
    return httpClient.delete(`/admin/schedule/${scheduleId}`).then(unwrap)
  },
}
