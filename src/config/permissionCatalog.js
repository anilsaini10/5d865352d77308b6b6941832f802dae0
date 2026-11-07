const CAMEL_CASE_RE = /^[a-z][a-zA-Z0-9]{0,63}$/

export const SCHOOL_PERMISSIONS = [
  {
    group: 'Default',
    items: [
      { key: 'studentsModule', label: 'Students module', type: 'boolean', default: true },
      { key: 'teachersModule', label: 'Teachers module', type: 'boolean', default: true },
      { key: 'staffModule', label: 'Staff module', type: 'boolean', default: true },
      { key: 'attendanceModule', label: 'Student attendance module', type: 'boolean', default: true },
      { key: 'announcementsModule', label: 'Announcements module', type: 'boolean', default: true },
      { key: 'eventsModule', label: 'Events module', type: 'boolean', default: true },
      { key: 'notificationsModule', label: 'Notifications module', type: 'boolean', default: true },
      { key: 'leaveModule', label: 'Leave requests module', type: 'boolean', default: true },
      { key: 'recoveryModule', label: 'Recovery requests module', type: 'boolean', default: true },
      { key: 'schoolSettingsModule', label: 'School settings access', type: 'boolean', default: true },
    ],
  },
  {
    group: 'Academics',
    items: [
      { key: 'timetableModule', label: 'Timetable module', type: 'boolean', default: false },
      { key: 'examsModule', label: 'Exams module', type: 'boolean', default: false },
      { key: 'calendarModule', label: 'Academic calendar module', type: 'boolean', default: false },
      { key: 'marksEntryModule', label: 'Marks entry', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Advanced',
    items: [
      { key: 'teacherAttendanceModule', label: 'Teacher attendance module', type: 'boolean', default: false },
      { key: 'roleAccountsModule', label: 'Role accounts module', type: 'boolean', default: false },
      { key: 'availabilityModule', label: 'Teacher availability module', type: 'boolean', default: false },
      { key: 'analyticsModule', label: 'Analytics module', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Fees',
    items: [
      { key: 'feesModule', label: 'Fees module', type: 'boolean', default: false },
      { key: 'feesCollect', label: 'Collect fees', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Salary',
    items: [
      { key: 'salaryView', label: 'View staff salary', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Reports',
    items: [
      { key: 'reportsView', label: 'View reports', type: 'boolean', default: false },
    ],
  },
]

export const ROLE_PERMISSIONS = [
  {
    group: 'Default',
    items: [
      { key: 'classesView', label: 'View classes', type: 'boolean', default: true },
      { key: 'subjectsView', label: 'View subjects', type: 'boolean', default: true },
      { key: 'studentsView', label: 'View students', type: 'boolean', default: true },
      { key: 'teachersView', label: 'View teachers', type: 'boolean', default: true },
      { key: 'staffView', label: 'View staff', type: 'boolean', default: true },
      { key: 'attendanceView', label: 'View student attendance', type: 'boolean', default: true },
      { key: 'attendanceHistory', label: 'Attendance history', type: 'boolean', default: true },
      { key: 'examsView', label: 'View exams', type: 'boolean', default: true },
      { key: 'marksView', label: 'View marks & grades', type: 'boolean', default: true },
      { key: 'timetableView', label: 'View timetable', type: 'boolean', default: true },
      { key: 'calendarView', label: 'View academic calendar', type: 'boolean', default: true },
      { key: 'announcementsView', label: 'View announcements', type: 'boolean', default: true },
      { key: 'eventsView', label: 'View events', type: 'boolean', default: true },
      { key: 'notificationsView', label: 'View notifications', type: 'boolean', default: true },
      { key: 'leaveView', label: 'View leave requests', type: 'boolean', default: true },
      { key: 'recoveryView', label: 'View recovery requests', type: 'boolean', default: true },
    ],
  },
  {
    group: 'Attendance',
    items: [
      { key: 'attendanceMark', label: 'Mark student attendance', type: 'boolean', default: false },
      { key: 'teacherAttendanceView', label: 'View teacher attendance', type: 'boolean', default: false },
      { key: 'teacherAttendanceMark', label: 'Mark teacher attendance', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Academics',
    items: [
      { key: 'classesManage', label: 'Manage classes', type: 'boolean', default: false },
      { key: 'subjectsManage', label: 'Manage subjects', type: 'boolean', default: false },
      { key: 'timetableManage', label: 'Edit timetable', type: 'boolean', default: false },
      { key: 'calendarManage', label: 'Edit academic calendar', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Syllabus',
    items: [
      { key: 'syllabusDashboardView', label: 'View syllabus dashboard', type: 'boolean', default: false },
      { key: 'syllabusManage', label: 'View syllabus Manage', type: 'boolean', default: false },
      { key: 'syllabusChapterView', label: 'View chapters', type: 'boolean', default: false },
      { key: 'syllabusChapterManage', label: 'Manage chapters', type: 'boolean', default: false },
      { key: 'syllabusPlanView', label: 'View syllabus plans', type: 'boolean', default: false },
      { key: 'syllabusPlanManage', label: 'Manage syllabus plans', type: 'boolean', default: false },
      { key: 'syllabusClassProgressView', label: 'View class progress report', type: 'boolean', default: false },
      { key: 'syllabusTeacherProgressView', label: 'View teacher progress report', type: 'boolean', default: false },
      { key: 'syllabusDelayedView', label: 'View delayed chapters report', type: 'boolean', default: false },
      { key: 'syllabusApprovalView', label: 'View approvals', type: 'boolean', default: false },
      { key: 'syllabusApprovalManage', label: 'Approve / reject / correct', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Exams',
    items: [
      { key: 'examsManage', label: 'Manage exams', type: 'boolean', default: false },
      { key: 'marksEntry', label: 'Enter marks', type: 'boolean', default: false },
    ],
  },
  {
    group: 'People',
    items: [
      { key: 'studentsManage', label: 'Manage students', type: 'boolean', default: false },
      { key: 'studentIdCard', label: 'Generate student ID card', type: 'boolean', default: false },
      { key: 'teachersManage', label: 'Manage teachers', type: 'boolean', default: false },
      { key: 'staffManage', label: 'Manage staff', type: 'boolean', default: false },
      { key: 'roleAccountsView', label: 'View role accounts', type: 'boolean', default: false },
      { key: 'roleAccountsManage', label: 'Manage role accounts', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { key: 'reportsView', label: 'View reports', type: 'boolean', default: false },
      { key: 'reportFormat', label: 'Report format', type: 'select', options: ['pdf', 'excel'], default: 'pdf' },
      { key: 'analyticsStudents', label: 'Student analytics', type: 'boolean', default: false },
      { key: 'analyticsAttendance', label: 'Attendance analytics', type: 'boolean', default: false },
      { key: 'analyticsAcademics', label: 'Academics analytics', type: 'boolean', default: false },
      { key: 'analyticsTeachers', label: 'Teachers analytics', type: 'boolean', default: false },
      { key: 'analyticsHomework', label: 'Homework analytics', type: 'boolean', default: false },
      { key: 'analyticsComparisons', label: 'Comparisons analytics', type: 'boolean', default: false },
      { key: 'analyticsAlerts', label: 'Alerts analytics', type: 'boolean', default: false },
      { key: 'analyticsInterventions', label: 'Interventions analytics', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Communication',
    items: [
      { key: 'announcementsManage', label: 'Send announcements', type: 'boolean', default: false },
      { key: 'eventsManage', label: 'Manage events', type: 'boolean', default: false },
      { key: 'notificationsSend', label: 'Send notifications', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Requests',
    items: [
      { key: 'leaveApprove', label: 'Approve / reject leave', type: 'boolean', default: false },
      { key: 'recoveryApprove', label: 'Approve / reject recovery', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Availability',
    items: [
      { key: 'availabilityView', label: 'View teacher availability', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Fees',
    items: [
      { key: 'feesCollect', label: 'Collect fees', type: 'boolean', default: false },
      { key: 'receiptPrint', label: 'Print receipts', type: 'boolean', default: false },
      { key: 'maxDiscountPercent', label: 'Max discount (%)', type: 'number', default: 0, min: 0, max: 100 },
    ],
  },
  {
    group: 'Salary',
    items: [
      { key: 'salaryView', label: 'View staff salary', type: 'boolean', default: false },
    ],
  },
  {
    group: 'Settings',
    items: [
      { key: 'schoolSettings', label: 'Access school settings', type: 'boolean', default: false },
      { key: 'rolePermissions', label: 'Manage role permissions', type: 'boolean', default: false },
    ],
  },
]

function assertCatalog(catalog, name) {
  const seen = new Set()
  for (const group of catalog) {
    for (const item of group.items) {
      if (!CAMEL_CASE_RE.test(item.key)) {
        throw new Error(`[${name}] key "${item.key}" is not valid camelCase`)
      }
      if (seen.has(item.key)) {
        throw new Error(`[${name}] duplicate key "${item.key}"`)
      }
      seen.add(item.key)
    }
  }
}

if (import.meta.env.DEV) {
  assertCatalog(SCHOOL_PERMISSIONS, 'SCHOOL_PERMISSIONS')
  assertCatalog(ROLE_PERMISSIONS, 'ROLE_PERMISSIONS')
}

export function getPerm(perms, key, catalogItem) {
  return key in perms ? perms[key] : catalogItem.default
}

export function flatItems(catalog) {
  return catalog.flatMap((g) => g.items)
}
