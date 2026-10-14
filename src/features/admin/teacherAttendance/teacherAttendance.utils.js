import { ATTENDANCE_STATUSES, enumMeta } from '../constants.js'
import { todayInput } from '../../../utils/format.js'
import { teacherAttendanceApi } from './teacherAttendance.api.js'

const PAGE_SIZE = 100
/** "Today after school hours" for the not-checked-out flag (local time, 24h). */
const SCHOOL_END_HOUR = 18

/** "2026-10-13" → "13 Oct 2026", parsed as a local date so it never shifts. */
export function formatDay(value) {
  if (!value) return '—'
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** ISO timestamp → "08:16 AM" in the viewer's local time. */
export function formatClock(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()
}

/** 420 → "7h 0m" */
export function formatWorked(minutes) {
  if (minutes == null) return '—'
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export const statusLabel = (value) => enumMeta(ATTENDANCE_STATUSES, value).label

export const mapLink = (lat, lng) => (lat != null && lng != null ? `https://maps.google.com/?q=${lat},${lng}` : '')

/** Great-circle distance in metres between two lat/lng points. */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** 850 → "850 m", 1240 → "1.24 km" */
export function formatDistance(meters) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`
}

/** Teacher and admin both marked the day, with different answers. */
export const isMismatch = (r) => !!r.teacherStatus && !!r.adminStatus && r.teacherStatus !== r.adminStatus

export function mismatchTitle(r) {
  const at = formatClock(r.teacherMarkedAt)
  return `Checked in${at ? ` ${at}` : ''} but marked ${statusLabel(r.adminStatus)}`
}

/** Checked in, never checked out, and the day is over (past, or today after school hours). */
export function isNotCheckedOut(r) {
  if (!r.teacherMarkedAt || r.teacherCheckOutAt) return false
  const today = todayInput()
  if (r.date < today) return true
  return r.date === today && new Date().getHours() >= SCHOOL_END_HOUR
}

/** Every record matching `query` (date, or from/to, plus filters), following pagination. */
export async function fetchAll(query) {
  const first = await teacherAttendanceApi.list({ ...query, page: 1, pageSize: PAGE_SIZE })
  if (first.totalPages <= 1) return first.items
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) => teacherAttendanceApi.list({ ...query, page: i + 2, pageSize: PAGE_SIZE }))
  )
  return [...first.items, ...rest.flatMap((r) => r.items)]
}

export const fetchAllForDate = (date, filters = {}) => fetchAll({ ...filters, date })

const csvCell = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function recordsToCsv(records) {
  const header = ['Date', 'Teacher', 'Employee ID', 'Check-in', 'Check-out', 'Worked', 'Check-in lat', 'Check-in lng', 'Check-out lat', 'Check-out lng', 'Admin status', 'Marked by', 'Final status']
  const lines = records.map((r) => [
    r.date, r.teacherName, r.employeeId, formatClock(r.teacherMarkedAt), formatClock(r.teacherCheckOutAt), r.workedMinutes != null ? formatWorked(r.workedMinutes) : '',
    r.teacherLatitude, r.teacherLongitude, r.teacherCheckOutLatitude, r.teacherCheckOutLongitude, r.adminStatus, r.adminMarkedBy?.name, r.status,
  ])
  return [header, ...lines].map((row) => row.map(csvCell).join(',')).join('\n')
}

export function downloadCsv(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
