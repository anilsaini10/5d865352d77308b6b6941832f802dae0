export const MAX_ROWS = 500
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

const cleanCell = (key, value) => {
  if (value == null) return ''
  if ((key === 'startDate' || key === 'endDate') && typeof value === 'number') return serialToIso(value)
  if (value instanceof Date) return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  return String(value).trim()
}

/**
 * Reads the first sheet of an .xlsx/.xls/.csv file into row objects using the header row
 * (extra columns are ignored, header names are matched loosely). xlsx is loaded on demand.
 * @returns {Promise<{ rows: Record<string,string>[], missing: string[] }>}
 */
export async function parseEventsFile(file) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
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
export const toPayload = (rows) =>
  rows.map((r) => {
    const out = { title: r.title.trim(), eventType: r.eventType.trim(), startDate: r.startDate.trim() }
    if (r.description.trim()) out.description = r.description.trim()
    if (r.audience.trim()) out.audience = r.audience.trim()
    if (r.endDate.trim()) out.endDate = r.endDate.trim()
    return out
  })

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
