// ── Chapter form ────────────────────────────────────────────────

export const emptyChapterForm = {
  name: '',
  chapterNumber: '',
  description: '',
  subjectId: '',
  classId: '',
  expectedWorkingDays: '0',
  sequenceNumber: '',
}

export function chapterToForm(ch) {
  return {
    name: ch.name ?? '',
    chapterNumber: ch.chapterNumber != null ? String(ch.chapterNumber) : '',
    description: ch.description ?? '',
    subjectId: ch.subjectId ?? '',
    classId: ch.classId ?? '',
    expectedWorkingDays: ch.expectedWorkingDays != null ? String(ch.expectedWorkingDays) : '0',
    sequenceNumber: ch.sequenceNumber != null ? String(ch.sequenceNumber) : '',
  }
}

export function chapterFormToPayload(form) {
  return {
    name: form.name.trim(),
    chapterNumber: Number(form.chapterNumber),
    description: form.description.trim() || undefined,
    subjectId: form.subjectId,
    classId: form.classId,
    expectedWorkingDays: Number(form.expectedWorkingDays || 0),
    sequenceNumber: Number(form.sequenceNumber),
  }
}

export function validateChapterForm(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Chapter name is required.'
  else if (form.name.trim().length > 200) errors.name = 'Max 200 characters.'
  if (!form.chapterNumber || Number(form.chapterNumber) < 1) errors.chapterNumber = 'Must be at least 1.'
  if (!form.classId) errors.classId = 'Select a class.'
  if (!form.subjectId) errors.subjectId = 'Select a subject.'
  if (!form.sequenceNumber || Number(form.sequenceNumber) < 1) errors.sequenceNumber = 'Must be at least 1.'
  if (form.description && form.description.length > 1000) errors.description = 'Max 1000 characters.'
  const days = Number(form.expectedWorkingDays)
  if (Number.isNaN(days) || days < 0) errors.expectedWorkingDays = 'Must be 0 or more.'
  return errors
}

// ── Plan form ───────────────────────────────────────────────────

export function validatePlanForm(form) {
  const errors = {}
  if (!form.sessionYear) errors.sessionYear = 'Session year is required.'
  if (!form.classId) errors.classId = 'Select a class.'
  if (!form.sectionId) errors.sectionId = 'Select a section.'
  if (!form.subjectId) errors.subjectId = 'Select a subject.'
  if (!form.chapters || form.chapters.length === 0) errors.chapters = 'Select at least one chapter.'
  if (form.remarks && form.remarks.length > 1000) errors.remarks = 'Max 1000 characters.'
  return errors
}

export function planFormToPayload(form) {
  return {
    sessionYear: Number(form.sessionYear),
    classId: form.classId,
    sectionId: form.sectionId,
    subjectId: form.subjectId,
    teacherId: form.teacherId || undefined,
    remarks: form.remarks?.trim() || undefined,
    approvalEnabled: form.approvalEnabled ?? false,
    chapters: form.chapters.map((ch, i) => ({
      chapterId: ch.chapterId,
      sequenceNumber: ch.sequenceNumber ?? i + 1,
      expectedWorkingDays: Number(ch.expectedWorkingDays || 0),
      plannedStartDate: ch.plannedStartDate || undefined,
      plannedEndDate: ch.plannedEndDate || undefined,
      adminRemarks: ch.adminRemarks?.trim() || undefined,
    })),
  }
}

// ── Approval form ───────────────────────────────────────────────

export function validateApproveForm(form) {
  const errors = {}
  if (form.approvedPercentage === '' || form.approvedPercentage == null) errors.approvedPercentage = 'Enter approved percentage.'
  else if (Number(form.approvedPercentage) < 0 || Number(form.approvedPercentage) > 100) errors.approvedPercentage = 'Must be 0-100.'
  return errors
}

export function validateRejectForm(form) {
  const errors = {}
  if (!form.rejectionRemarks?.trim()) errors.rejectionRemarks = 'Rejection remarks are required.'
  else if (form.rejectionRemarks.length > 1000) errors.rejectionRemarks = 'Max 1000 characters.'
  return errors
}

export function validateCorrectionForm(form) {
  const errors = {}
  if (form.completionPercentage === '' || form.completionPercentage == null) errors.completionPercentage = 'Enter percentage.'
  else if (Number(form.completionPercentage) < 0 || Number(form.completionPercentage) > 100) errors.completionPercentage = 'Must be 0-100.'
  if (!form.correctionRemarks?.trim()) errors.correctionRemarks = 'Correction remarks are required.'
  else if (form.correctionRemarks.length > 1000) errors.correctionRemarks = 'Max 1000 characters.'
  return errors
}

// ── Subject form (for enhanced subjects page) ───────────────────

export function validateSubjectForm(form) {
  const errors = {}
  if (!form.name?.trim()) errors.name = 'Subject name is required.'
  else if (form.name.trim().length > 100) errors.name = 'Max 100 characters.'
  if (form.description && form.description.length > 500) errors.description = 'Max 500 characters.'
  return errors
}
