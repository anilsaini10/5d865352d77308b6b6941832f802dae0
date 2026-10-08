import { httpClient } from '../../../api/httpClient.js'
import { unwrap, params } from '../../../api/apiHelpers.js'

// Reviewing a request is one-shot: a second PATCH returns 409 LEAVE_ALREADY_REVIEWED.

export const leaveApi = {
  /** Student leave requests. status: PENDING | APPROVED | REJECTED */
  listStudent({ status, classId, sectionId } = {}) {
    return httpClient.get('/admin/leave', { params: params({ status, classId, sectionId }) }).then(unwrap)
  },

  /** Approving auto-marks attendance as LEAVE for the range and notifies the parent. */
  reviewStudent(leaveId, { status, reviewRemarks }) {
    return httpClient.patch(`/admin/leave/${leaveId}`, params({ status, reviewRemarks })).then(unwrap)
  },

  listTeacher({ status } = {}) {
    return httpClient.get('/admin/leave/teachers', { params: params({ status }) }).then(unwrap)
  },

  /** Notifies the teacher. */
  reviewTeacher(leaveId, { status, reviewRemarks }) {
    return httpClient.patch(`/admin/leave/teachers/${leaveId}`, params({ status, reviewRemarks })).then(unwrap)
  },
}
