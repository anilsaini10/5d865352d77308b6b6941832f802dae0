import { httpClient } from '../../../api/httpClient.js'
import { unwrap, params } from '../../../api/apiHelpers.js'

/**
 * @typedef {{type:'CLASS'|'INVIGILATION'|'LEAVE'|'ABSENT', title:string, startTime?:string, endTime?:string,
 *   className?:string, sectionName?:string, subjectName?:string, roomNo?:string}} BusyBlock
 */

export const availabilityApi = {
  /**
   * Who is free in a slot? Pass exactly one of `date` / `day`, plus startTime/endTime ("HH:MM").
   * @returns {Promise<{query:Object, schoolClosed:null|{reason:string,title:string}, summary:{total:number,free:number,busy:number},
   *   items:{teacherId:string, userId:string, name:string, employeeId:string, phone:string, subjects:string[], free:boolean, busy:BusyBlock[]}[]}>}
   */
  find({ date, day, startTime, endTime, onlyFree, search } = {}) {
    return httpClient
      .get('/admin/teachers/availability', { params: params({ date, day, startTime, endTime, onlyFree: onlyFree || undefined, search }) })
      .then(unwrap)
  },

  /**
   * Free/busy timeline. Omit teacherId for everyone; omit date and day for the whole week (Mon–Sat).
   * @returns {Promise<{days:{day:string, date:string|null, window:{from:string,to:string,source:string}, schoolClosed:null|{reason:string,title:string}}[],
   *   teachers:{teacherId:string, name:string, employeeId:string, phone:string, subjects:string[],
   *   days:{day:string, date:string|null, unavailable:null|{type:'LEAVE'|'ABSENT', title:string}, busy:BusyBlock[],
   *   free:{startTime:string,endTime:string,minutes:number}[], freeMinutes:number}[]}[]}>}
   */
  freeSlots({ teacherId, date, day, from, to, minMinutes } = {}) {
    return httpClient
      .get('/admin/teachers/free-slots', { params: params({ teacherId, date, day, from, to, minMinutes }) })
      .then(unwrap)
  },
}
