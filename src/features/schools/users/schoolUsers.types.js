/**
 * @typedef {'students' | 'teachers' | 'staff'} SchoolUserType
 */

/**
 * @typedef {Object} StudentItem
 * @property {string} id
 * @property {string} admissionNo
 * @property {string} name
 * @property {'MALE'|'FEMALE'|'OTHER'} gender
 * @property {string|null} dateOfBirth
 * @property {string|null} classId
 * @property {string|null} className
 * @property {string|null} sectionId
 * @property {string|null} sectionName
 * @property {number|null} rollNo
 * @property {string|null} parentUserId
 * @property {string|null} parentName
 * @property {string|null} parentPhone
 * @property {string|null} parentEmail
 * @property {string|null} bloodGroup
 * @property {string|null} address
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {number|null} attendancePercentage
 */

/**
 * @typedef {Object} TeacherSubject
 * @property {string} subjectId
 * @property {string} name
 * @property {string} classId
 * @property {string} className
 */

/**
 * @typedef {Object} TeacherClassTeacher
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {string} classId
 * @property {string} className
 */

/**
 * @typedef {Object} TeacherItem
 * @property {string} id
 * @property {string} userId
 * @property {string} employeeId
 * @property {string} name
 * @property {'MALE'|'FEMALE'|'OTHER'} gender
 * @property {string|null} email
 * @property {string|null} username
 * @property {string|null} phone
 * @property {TeacherSubject[]} subjects
 * @property {TeacherClassTeacher[]} classTeacherOf
 * @property {string|null} joiningDate
 * @property {number|null} salary
 * @property {string|null} qualification
 * @property {number|null} experienceYears
 * @property {number|null} experienceMonths
 * @property {string[]} subjectsTaught
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {number|null} performanceScore
 */

/**
 * @typedef {Object} StaffCustomRole
 * @property {string} id
 * @property {string} key
 * @property {string} name
 */

/**
 * @typedef {Object} StaffItem
 * @property {string} id
 * @property {string} employeeId
 * @property {string} userId
 * @property {string} name
 * @property {string|null} email
 * @property {string|null} phone
 * @property {string|null} username
 * @property {'MALE'|'FEMALE'|'OTHER'} gender
 * @property {string|null} designation
 * @property {string|null} customRoleId
 * @property {StaffCustomRole|null} customRole
 * @property {number|null} salary
 * @property {string|null} qualification
 * @property {number|null} experienceYears
 * @property {number|null} experienceMonths
 * @property {string|null} joiningDate
 * @property {'ACTIVE'|'INACTIVE'} status
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} SchoolUsersResult
 * @property {string} type
 * @property {Array<StudentItem|TeacherItem|StaffItem>} items
 * @property {number} page
 * @property {number} pageSize
 * @property {number} total
 * @property {number} totalPages
 */

export {}
