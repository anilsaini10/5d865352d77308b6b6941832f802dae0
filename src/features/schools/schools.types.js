export const BOARD_OPTIONS = ['CBSE', 'ICSE', 'STATE_BOARD', 'IB', 'OTHER']
export const SCHOOL_TYPE_OPTIONS = ['CO_ED', 'BOYS', 'GIRLS']

export const BOARD_LABELS = {
  CBSE: 'CBSE',
  ICSE: 'ICSE',
  STATE_BOARD: 'State Board',
  IB: 'IB',
  OTHER: 'Other',
}

export const SCHOOL_TYPE_LABELS = {
  CO_ED: 'Co-Ed',
  BOYS: 'Boys',
  GIRLS: 'Girls',
}

/**
 * @typedef {Object} School
 * @property {string} id
 * @property {string} name
 * @property {string} code
 * @property {string|null} board
 * @property {string|null} schoolType
 * @property {string|null} medium
 * @property {number|null} establishedYear
 * @property {string|null} logoUrl
 * @property {string|null} addressLine1
 * @property {string|null} addressLine2
 * @property {string|null} city
 * @property {string|null} state
 * @property {string|null} pincode
 * @property {string|null} country
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {string|null} contactEmail
 * @property {string|null} contactPhone
 * @property {string|null} alternatePhone
 * @property {string|null} websiteUrl
 * @property {string|null} principalName
 * @property {string|null} principalEmail
 * @property {string|null} principalPhone
 * @property {number|null} totalStudentsApprox
 * @property {number|null} totalStaffApprox
 * @property {string|null} classesFrom
 * @property {string|null} classesTo
 * @property {number|null} academicSessionStartMonth
 * @property {string} createdAt
 */

/**
 * @typedef {Object} SchoolListResult
 * @property {School[]} items
 * @property {number} page
 * @property {number} pageSize
 * @property {number} total
 * @property {number} totalPages
 */

/**
 * @typedef {Object} CreateSchoolResult
 * @property {School} school
 * @property {import('../admins/admins.types.js').SchoolAdmin} [admin]
 * @property {string} [defaultPassword]
 */

export {}
