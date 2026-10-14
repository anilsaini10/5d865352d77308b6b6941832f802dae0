import { SCHOOL_NUMBER_FIELDS, SCHOOL_STRING_FIELDS, toSchoolFormValues } from '../../schools/schools.validation.js'

const REQUIRED = new Set(['name'])
export { toSchoolFormValues }

/**
 * Diffs form values against the saved school and returns only what changed.
 * Cleared optional fields go out as null; latitude/longitude are sent as a pair.
 */
export function buildChangedPayload(values, school) {
  const before = toSchoolFormValues(school)
  const payload = {}

  for (const key of SCHOOL_STRING_FIELDS) {
    const next = (values[key] ?? '').trim()
    if (next !== String(before[key]).trim()) payload[key] = next === '' && !REQUIRED.has(key) ? null : next
  }
  for (const key of SCHOOL_NUMBER_FIELDS) {
    if (key === 'latitude' || key === 'longitude') continue
    const raw = values[key]
    const next = raw === '' || raw == null ? '' : Number(raw)
    if (next !== before[key]) payload[key] = next === '' ? null : next
  }

  const latChanged = String(values.latitude ?? '') !== String(before.latitude)
  const lngChanged = String(values.longitude ?? '') !== String(before.longitude)
  if (latChanged || lngChanged) {
    const blank = (v) => v === '' || v == null
    payload.latitude = blank(values.latitude) ? null : Number(values.latitude)
    payload.longitude = blank(values.longitude) ? null : Number(values.longitude)
  }
  return payload
}

/** "name: msg, other: msg" → { name: 'msg', other: 'msg' }. Returns {} when it doesn't look like that. */
export function parseFieldErrors(message) {
  const out = {}
  String(message ?? '').split(/,\s(?=\w+:\s)/).forEach((part) => {
    const m = part.match(/^(\w+):\s(.+)$/)
    if (m) out[m[1]] = m[2]
  })
  return out
}

/** Google Maps pin at the coordinates, titled "My coordinates". */
export const mapsUrl = (lat, lng, title = 'My coordinates') => `https://www.google.com/maps?q=${lat},${lng}(${encodeURIComponent(title)})`

export function osmEmbedUrl(lat, lng) {
  const d = 0.005
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`
}
