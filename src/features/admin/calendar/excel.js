export const MAX_ROWS = 500
export const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB
const MAX_UNZIPPED_BYTES = 30 * 1024 * 1024 // guards against zip bombs (a tiny .xlsx that inflates huge)
const MAX_ZIP_ENTRIES = 300
const ALLOWED_EXT = ['xlsx', 'xls', 'csv']
const MAX_LEN = { title: 200, description: 1000, eventType: 50, audience: 50, startDate: 30, endDate: 30 }
export const COLUMNS = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description' },
  { key: 'eventType', label: 'Type', required: true },
  { key: 'audience', label: 'Audience' },
  { key: 'startDate', label: 'Start date', required: true },
  { key: 'endDate', label: 'End date' },
]

const ALIASES = {
  title: 'title', name: 'title', event: 'title',
  description: 'description', details: 'description', notes: 'description',
  eventtype: 'eventType', type: 'eventType', category: 'eventType',
  audience: 'audience', for: 'audience', visibility: 'audience',
  startdate: 'startDate', start: 'startDate', from: 'startDate', date: 'startDate',
  enddate: 'endDate', end: 'endDate', to: 'endDate', till: 'endDate',
}
const normalize = (h) => String(h ?? '').toLowerCase().replace(/[^a-z]/g, '')

const pad = (n) => String(n).padStart(2, '0')
/** Excel date serial → "YYYY-MM-DD" (1900 date system). */
function serialToIso(serial) {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g
const stripControl = (v) => String(v).replace(CONTROL_CHARS, '')

const cleanCell = (key, value) => {
  if (value == null) return ''
  if ((key === 'startDate' || key === 'endDate') && typeof value === 'number') return serialToIso(value)
  if (value instanceof Date) return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  return stripControl(value).trim()
}

// ───────────────────────── security checks ─────────────────────────

class UnsafeFileError extends Error {
  safe = true // message is user-friendly and can be shown as is
}

const hasBytes = (bytes, needle) => {
  const n = Array.from(needle, (c) => c.charCodeAt(0))
  outer: for (let i = 0; i <= bytes.length - n.length; i++) {
    for (let j = 0; j < n.length; j++) if (bytes[i + j] !== n[j]) continue outer
    return true
  }
  return false
}
const utf16 = (str) => Array.from(str).flatMap((c) => [c, '\0']).join('')

/** Walks the zip central directory (no decompression) to catch macros, embedded objects, path tricks and zip bombs. */
function inspectZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new UnsafeFileError('This file is damaged or is not a real .xlsx workbook.')
  const count = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)
  if (count > MAX_ZIP_ENTRIES) throw new UnsafeFileError('This workbook contains too many internal parts to be a normal spreadsheet.')

  let total = 0
  const decoder = new TextDecoder()
  for (let i = 0; i < count; i++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) throw new UnsafeFileError('This file is damaged or is not a real .xlsx workbook.')
    const size = view.getUint32(offset + 24, true)
    const nameLen = view.getUint16(offset + 28, true)
    const extraLen = view.getUint16(offset + 30, true)
    const commentLen = view.getUint16(offset + 32, true)
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLen)).toLowerCase()
    total += size
    if (total > MAX_UNZIPPED_BYTES) throw new UnsafeFileError('This workbook expands to an unreasonable size and was blocked.')
    if (name.includes('..') || name.startsWith('/') || name.includes('\\')) throw new UnsafeFileError('This workbook has an unsafe internal path and was blocked.')
    if (name.includes('vbaproject') || name.endsWith('.bin') || name.includes('macros/')) throw new UnsafeFileError('Workbooks with macros (VBA) are not allowed. Save a plain .xlsx without macros.')
    if (name.includes('embeddings/') || name.includes('activex') || name.includes('oleobject') || name.endsWith('.exe') || name.endsWith('.dll') || name.endsWith('.js') || name.endsWith('.html')) {
      throw new UnsafeFileError('Workbooks with embedded objects or scripts are not allowed. Use a plain spreadsheet.')
    }
    offset += 46 + nameLen + extraLen + commentLen
  }
}

/**
 * Checks a chosen file before it is parsed: type, size, real file signature (not just the extension),
 * macros / embedded objects, zip bombs. Throws an Error with a user-friendly message when unsafe.
 */
export async function assertSafeFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_EXT.includes(ext)) throw new UnsafeFileError('Only .xlsx, .xls or .csv files are allowed.')
  if (file.size === 0) throw new UnsafeFileError('This file is empty.')
  if (file.size > MAX_FILE_BYTES) throw new UnsafeFileError(`File is too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB).`)

  const bytes = new Uint8Array(await file.arrayBuffer())
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04
  const isOle = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every((b, i) => bytes[i] === b)
  const isExe = bytes[0] === 0x4d && bytes[1] === 0x5a // "MZ" Windows executable
  const isPdfOrScript = hasBytes(bytes.subarray(0, 16), '%PDF') || hasBytes(bytes.subarray(0, 16), '#!') || hasBytes(bytes.subarray(0, 16), '<?php')
  if (isExe || isPdfOrScript) throw new UnsafeFileError('This is not a spreadsheet — the file was blocked.')

  if (ext === 'xlsx') {
    if (!isZip) throw new UnsafeFileError('This file is not a genuine .xlsx workbook (its contents do not match its extension).')
    inspectZip(bytes)
  } else if (ext === 'xls') {
    if (!isOle) throw new UnsafeFileError('This file is not a genuine .xls workbook (its contents do not match its extension).')
    if (hasBytes(bytes, utf16('_VBA_PROJECT')) || hasBytes(bytes, utf16('VBA')) || hasBytes(bytes, utf16('ObjectPool'))) {
      throw new UnsafeFileError('Workbooks with macros or embedded objects are not allowed. Save a plain .xlsx without macros.')
    }
  } else {
    // csv must be plain text
    if (isZip || isOle) throw new UnsafeFileError('This file is not a plain CSV (its contents do not match its extension).')
    if (bytes.subarray(0, 65536).includes(0)) throw new UnsafeFileError('This CSV contains binary data and was blocked.')
  }
}

const TAG_OR_SCRIPT = /<\s*\/?\s*[a-z!?]|javascript\s*:|vbscript\s*:|data\s*:\s*text\/html|\bon[a-z]+\s*=|&#x?[0-9a-f]+;|\$\{|\{\{|<%|%3c/i
const DB_ATTACK = /(\bunion\b[\s\S]{0,20}\bselect\b|\bdrop\s+(table|database)\b|\bdelete\s+from\b|\binsert\s+into\b|;\s*(select|drop|update|delete|insert)\b|--\s*$|\/\*|\*\/|\$where|\$ne\b|\$gt\b|\$regex|\bxp_cmdshell\b)/i
const SHELL_OR_PATH = /(\.\.[\\/]|\b(?:cmd|powershell|bash|sh)\s+-?\w|`|\$\(|\|\||&&|\bcurl\s|\bwget\s|\/etc\/passwd)/i
const FORMULA_START = /^[=+\-@\t\r]/

/**
 * Content check for one row (also used after the user edits a cell).
 * Returns a list of human-readable problems — empty when the row is clean.
 */
export function checkRow(r) {
  const errors = []
  for (const c of COLUMNS) {
    const v = String(r[c.key] ?? '')
    if (!v) continue
    if (v.length > MAX_LEN[c.key]) errors.push(`${c.label} is too long (max ${MAX_LEN[c.key]} characters)`)
    if (CONTROL_CHARS.test(v)) { CONTROL_CHARS.lastIndex = 0; errors.push(`${c.label} has hidden/control characters`) }
    CONTROL_CHARS.lastIndex = 0
    if (FORMULA_START.test(v)) errors.push(`${c.label} starts with "${v[0]}" (spreadsheet formula) — remove it`)
    else if (TAG_OR_SCRIPT.test(v)) errors.push(`${c.label} contains script/HTML-like content`)
    else if (DB_ATTACK.test(v)) errors.push(`${c.label} contains database-command-like content`)
    else if (SHELL_OR_PATH.test(v)) errors.push(`${c.label} contains command/path-like content`)
  }
  return errors
}

/** Runs checkRow over every row → { [index]: string[] } (only rows with problems). */
export function checkRows(rows) {
  const out = {}
  rows.forEach((r, i) => {
    const errs = checkRow(r)
    if (errs.length) out[i] = errs
  })
  return out
}

/**
 * Reads the first sheet of an .xlsx/.xls/.csv file into row objects using the header row
 * (extra columns are ignored, header names are matched loosely). xlsx is loaded on demand.
 * @returns {Promise<{ rows: Record<string,string>[], missing: string[] }>}
 */
export async function parseEventsFile(file) {
  await assertSafeFile(file)
  const XLSX = await import('xlsx')
  // Formulas, HTML, styles and VBA are never parsed (only cached plain values); sheetRows caps work on huge sheets.
  const wb = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    cellFormula: false,
    cellHTML: false,
    cellStyles: false,
    cellNF: false,
    bookVBA: false,
    bookFiles: false,
    sheetRows: MAX_ROWS + 2,
    sheets: 0,
  })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return { rows: [], missing: COLUMNS.filter((c) => c.required).map((c) => c.label) }

  const [header = [], ...body] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true, blankrows: false })
  const colFor = {}
  header.forEach((h, i) => {
    const key = ALIASES[normalize(h)]
    if (key && !(key in colFor)) colFor[key] = i
  })
  const missing = COLUMNS.filter((c) => c.required && !(c.key in colFor)).map((c) => c.label)

  const rows = body
    .map((cells) => Object.fromEntries(COLUMNS.map((c) => [c.key, c.key in colFor ? cleanCell(c.key, cells[colFor[c.key]]) : ''])))
    .filter((r) => COLUMNS.some((c) => r[c.key] !== ''))
  return { rows, missing }
}

/** The JSON the API expects: blank optional cells are omitted. */
export const toPayload = (rows) => {
  const t = (r, k) => stripControl(r[k] ?? '').trim().slice(0, MAX_LEN[k])
  return rows.map((r) => {
    const out = { title: t(r, 'title'), eventType: t(r, 'eventType'), startDate: t(r, 'startDate') }
    if (t(r, 'description')) out.description = t(r, 'description')
    if (t(r, 'audience')) out.audience = t(r, 'audience')
    if (t(r, 'endDate')) out.endDate = t(r, 'endDate')
    return out
  })
}

/** Downloads a ready-to-fill template with example rows. */
export async function downloadTemplate() {
  const XLSX = await import('xlsx')
  const aoa = [
    ['title', 'description', 'eventType', 'audience', 'startDate', 'endDate'],
    ['Independence Day', '', 'Govt Holiday', 'All', '15/08/2026', ''],
    ['Summer Vacation', '', 'Vacation', 'All', '20/05/2026', '30/06/2026'],
    ['Parent-Teacher Meeting', 'Term 1 progress discussion', 'PTM', 'Parents', '10/07/2026', ''],
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 28 }, { wch: 32 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Calendar')
  XLSX.writeFile(wb, 'academic-calendar-template.xlsx')
}
