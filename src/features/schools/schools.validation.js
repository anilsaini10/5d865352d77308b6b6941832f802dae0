export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
export const PHONE_PATTERN = /^[0-9+\-\s]{10,15}$/
export const URL_PATTERN = /^https?:\/\/\S+$/

export const ESTABLISHED_YEAR_MIN = 1800
export const ESTABLISHED_YEAR_MAX = 2100
export const LATITUDE_MIN = -90
export const LATITUDE_MAX = 90
export const LONGITUDE_MIN = -180
export const LONGITUDE_MAX = 180
export const SESSION_MONTH_MIN = 1
export const SESSION_MONTH_MAX = 12

// Fields sent/received as plain strings — trimmed, and omitted from the
// payload when left blank.
export const SCHOOL_STRING_FIELDS = [
  'name',
  'board',
  'schoolType',
  'medium',
  'logoUrl',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'pincode',
  'country',
  'contactEmail',
  'contactPhone',
  'alternatePhone',
  'websiteUrl',
  'principalName',
  'principalEmail',
  'principalPhone',
  'classesFrom',
  'classesTo',
]

// Fields sent/received as numbers — cast with Number() on submit, omitted
// when the input was left blank.
export const SCHOOL_NUMBER_FIELDS = [
  'establishedYear',
  'latitude',
  'longitude',
  'totalStudentsApprox',
  'totalStaffApprox',
  'academicSessionStartMonth',
]

export const SCHOOL_FORM_FIELDS = [...SCHOOL_STRING_FIELDS, ...SCHOOL_NUMBER_FIELDS]

/** Converts a School API object into react-hook-form defaultValues (null → ''). */
export function toSchoolFormValues(school) {
  const values = {}
  for (const key of SCHOOL_FORM_FIELDS) {
    values[key] = school?.[key] ?? ''
  }
  return values
}

/** Converts react-hook-form values into the create/update API payload. `code` is never included. */
export function buildSchoolPayload(values) {
  const payload = {}

  for (const key of SCHOOL_STRING_FIELDS) {
    const trimmed = typeof values[key] === 'string' ? values[key].trim() : values[key]
    if (trimmed) payload[key] = trimmed
  }
  for (const key of SCHOOL_NUMBER_FIELDS) {
    const value = values[key]
    if (value !== '' && value !== undefined && value !== null) payload[key] = Number(value)
  }

  return payload
}
