import { httpClient } from '../../../api/httpClient.js'
import { unwrap, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {Object} CalendarEntry
 * @property {string} id
 * @property {'EVENT'|'EXAM'} source  EXAM entries come from the Exams module and are edited there
 * @property {string} type  EVENT_TYPES value
 * @property {string} title
 * @property {string|null} description
 * @property {'ALL'|'TEACHER'|'PARENT'} audience
 * @property {string} startDate  "YYYY-MM-DD"
 * @property {string} endDate
 * @property {number} days
 * @property {boolean} schoolClosed
 * @property {string[]} classes
 */

export const calendarApi = {
  /**
   * Pass `year` (session start year) OR `from`+`to` (max 400 days), or nothing for the current session.
   * @returns {Promise<{range:{from:string,to:string,session:{year:number,label:string}|null,sessionStartMonth:number},
   *   summary:Object, months:{month:string,label:string,startDate:string,endDate:string,totalDays:number,sundays:number,
   *   schoolClosedDays:number,workingDays:number,examDays:number,entries:CalendarEntry[]}[], entries:CalendarEntry[]}>}
   */
  get({ year, from, to, eventType } = {}) {
    return httpClient.get('/admin/academic-calendar', { params: params({ year, from, to, eventType }) }).then(unwrap)
  },
}
