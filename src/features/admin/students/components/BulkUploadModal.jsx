import { useState, useRef } from 'react'
import { read, utils, writeFile } from 'xlsx'
import { Upload, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Modal, Button, Alert, Badge } from '../../../../components/ui.jsx'
import { studentsApi } from '../students.api.js'
import { NAME_MIN, NAME_MAX, EMAIL_PATTERN, PHONE_PATTERN } from '../students.validation.js'
import { GENDERS, BLOOD_GROUPS } from '../../constants.js'
import { getErrorMessage } from '../../../../api/httpClient.js'
import { todayInput } from '../../../../utils/format.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls']
const MAX_CELL_LENGTH = 500

const TEMPLATE_COLUMNS = [
  'Name',
  'Gender',
  'Date of Birth',
  'Class',
  'Section',
  'Roll No',
  'Parent Name',
  'Parent Phone',
  'Parent Email',
  'Blood Group',
  'Address',
]

const REQUIRED_COLUMNS = [
  'Name',
  'Gender',
  'Date of Birth',
  'Class',
  'Section',
  'Roll No',
  'Parent Name',
  'Parent Phone',
  'Parent Email',
]

function sanitizeCell(raw) {
  if (raw == null) return ''
  let v = String(raw)
  // strip formula injection — cells starting with = + - @ \t \r can trigger execution in spreadsheet apps
  // and could carry payloads if echoed back in exports
  v = v.replace(/^[\s]*[=+\-@\t\r]+/, '')
  // strip HTML / script tags
  v = v.replace(/<[^>]*>/g, '')
  // strip control characters (keep newline and tab for address field)
  v = v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  // truncate
  if (v.length > MAX_CELL_LENGTH) v = v.slice(0, MAX_CELL_LENGTH)
  return v.trim()
}

function validateSheetFormat(sheet) {
  const headers = utils.sheet_to_json(sheet, { header: 1 })[0]
  if (!headers || !Array.isArray(headers)) return { valid: false, missing: REQUIRED_COLUMNS, extra: [] }
  const normalized = headers.map((h) => String(h ?? '').trim())
  const missing = REQUIRED_COLUMNS.filter((col) => !normalized.some((h) => h.toLowerCase() === col.toLowerCase()))
  const known = TEMPLATE_COLUMNS.map((c) => c.toLowerCase())
  const extra = normalized.filter((h) => h && !known.includes(h.toLowerCase()))
  return { valid: missing.length === 0, missing, extra }
}

const SAMPLE_ROW = {
  Name: 'Aarav Sharma',
  Gender: 'Male',
  'Date of Birth': '2015-06-15',
  Class: 'Class 5',
  Section: 'A',
  'Roll No': 1,
  'Parent Name': 'Rakesh Sharma',
  'Parent Phone': '9876543210',
  'Parent Email': 'rakesh@example.com',
  'Blood Group': 'B+',
  Address: '12 MG Road, Jaipur',
}

function downloadTemplate(classes) {
  const wb = utils.book_new()

  const rows = [SAMPLE_ROW]
  const ws = utils.json_to_sheet(rows, { header: TEMPLATE_COLUMNS })
  ws['!cols'] = TEMPLATE_COLUMNS.map((h) => ({ wch: Math.max(h.length + 4, 18) }))
  utils.book_append_sheet(wb, ws, 'Students')

  const refRows = []
  refRows.push({ Field: 'Gender', 'Allowed Values': GENDERS.map((g) => g.label).join(', ') })
  refRows.push({ Field: 'Blood Group', 'Allowed Values': BLOOD_GROUPS.join(', ') })
  refRows.push({ Field: 'Date of Birth', 'Allowed Values': 'YYYY-MM-DD format' })
  refRows.push({ Field: '', 'Allowed Values': '' })
  refRows.push({ Field: 'Class', 'Allowed Values': 'Section' })
  classes.forEach((c) => {
    const secs = c.sections?.map((s) => s.name).join(', ') || '—'
    refRows.push({ Field: c.name, 'Allowed Values': secs })
  })
  const refWs = utils.json_to_sheet(refRows)
  refWs['!cols'] = [{ wch: 20 }, { wch: 50 }]
  utils.book_append_sheet(wb, refWs, 'Reference')

  writeFile(wb, 'Student_Upload_Template.xlsx')
}

const GENDER_MAP = Object.fromEntries(GENDERS.map((g) => [g.label.toLowerCase(), g.value]))

function resolveGender(raw) {
  if (!raw) return ''
  const key = String(raw).trim().toLowerCase()
  return GENDER_MAP[key] || key.toUpperCase()
}

function resolveBloodGroup(raw) {
  if (!raw) return ''
  const v = String(raw).trim().toUpperCase().replace(/\s/g, '')
  return BLOOD_GROUPS.includes(v) ? v : ''
}

function formatDate(raw) {
  if (!raw) return ''
  if (typeof raw === 'number') {
    const d = new Date(Math.round((raw - 25569) * 86400 * 1000))
    return d.toISOString().slice(0, 10)
  }
  const s = String(raw).trim()
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''
  if (iso) return iso
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  return s
}

function parseRows(sheet) {
  return utils.sheet_to_json(sheet, { defval: '' }).map((row) => ({
    name: sanitizeCell(row['Name']),
    gender: resolveGender(sanitizeCell(row['Gender'])),
    dateOfBirth: formatDate(row['Date of Birth']),
    className: sanitizeCell(row['Class']),
    sectionName: sanitizeCell(row['Section']),
    rollNo: sanitizeCell(row['Roll No']),
    parentName: sanitizeCell(row['Parent Name']),
    parentPhone: sanitizeCell(row['Parent Phone']).replace(/\s/g, ''),
    parentEmail: sanitizeCell(row['Parent Email']).toLowerCase(),
    bloodGroup: resolveBloodGroup(sanitizeCell(row['Blood Group'])),
    address: sanitizeCell(row['Address']),
  }))
}

function resolveClassSection(row, classes) {
  const cls = classes.find((c) => c.name.toLowerCase() === row.className.toLowerCase())
  if (!cls) return { classId: '', sectionId: '', classError: `Class "${row.className}" not found` }
  const sec = cls.sections?.find((s) => s.name.toLowerCase() === row.sectionName.toLowerCase())
  if (!sec) return { classId: cls.id, sectionId: '', sectionError: `Section "${row.sectionName}" not found in ${cls.name}` }
  return { classId: cls.id, sectionId: sec.id }
}

function validateRow(row, classes) {
  const errors = []
  const name = row.name
  if (name.length < NAME_MIN || name.length > NAME_MAX) errors.push(`Name must be ${NAME_MIN}-${NAME_MAX} chars`)
  if (!['MALE', 'FEMALE', 'OTHER'].includes(row.gender)) errors.push(`Invalid gender "${row.gender}"`)
  if (!row.dateOfBirth) errors.push('Date of birth missing')
  else if (row.dateOfBirth > todayInput()) errors.push('DOB in the future')

  const { classId, sectionId, classError, sectionError } = resolveClassSection(row, classes)
  if (classError) errors.push(classError)
  if (sectionError) errors.push(sectionError)

  const roll = Number(row.rollNo)
  if (!row.rollNo || !Number.isInteger(roll) || roll < 1) errors.push('Roll number must be a positive whole number')

  const pName = row.parentName
  if (pName.length < NAME_MIN || pName.length > NAME_MAX) errors.push(`Parent name must be ${NAME_MIN}-${NAME_MAX} chars`)
  if (!PHONE_PATTERN.test(row.parentPhone)) errors.push('Invalid parent phone')
  if (!EMAIL_PATTERN.test(row.parentEmail)) errors.push('Invalid parent email')

  return { errors, classId, sectionId }
}

function rowToPayload(row, classId, sectionId) {
  return {
    name: row.name,
    gender: row.gender,
    dateOfBirth: row.dateOfBirth,
    classId,
    sectionId,
    rollNo: Number(row.rollNo),
    parentName: row.parentName,
    parentPhone: row.parentPhone,
    parentEmail: row.parentEmail,
    bloodGroup: row.bloodGroup || undefined,
    address: row.address || undefined,
  }
}

const STEPS = { UPLOAD: 'upload', PREVIEW: 'preview', RESULT: 'result' }

export default function BulkUploadModal({ open, onClose, classes, onDone }) {
  const fileRef = useRef(null)
  const [step, setStep] = useState(STEPS.UPLOAD)
  const [rows, setRows] = useState([])
  const [validated, setValidated] = useState([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState([])
  const [fileError, setFileError] = useState('')

  const reset = () => {
    setStep(STEPS.UPLOAD)
    setRows([])
    setValidated([])
    setResults([])
    setFileError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileError('')

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError('Only .xlsx and .xls files are allowed.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File is too large. Maximum size is 5 MB.')
      return
    }

    try {
      const buf = await file.arrayBuffer()
      const wb = read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      if (!ws) {
        setFileError('The file has no sheets. Please use the template.')
        return
      }

      const { valid, missing, extra } = validateSheetFormat(ws)
      if (!valid) {
        setFileError(`Missing required columns: ${missing.join(', ')}. Please use the template.`)
        return
      }
      if (extra.length > 0) {
        setFileError(`Unknown columns found: ${extra.join(', ')}. Only use columns from the template.`)
        return
      }

      const parsed = parseRows(ws)

      if (parsed.length === 0) {
        setFileError('No data rows found in the file.')
        return
      }
      if (parsed.length > 200) {
        setFileError('Maximum 200 students at a time. Please split the file.')
        return
      }

      const withValidation = parsed.map((row, i) => {
        const { errors, classId, sectionId } = validateRow(row, classes)
        return { index: i, row, errors, classId, sectionId }
      })

      setRows(parsed)
      setValidated(withValidation)
      setStep(STEPS.PREVIEW)
    } catch {
      setFileError('Could not read file. Make sure it is a valid .xlsx file.')
    }
  }

  const validCount = validated.filter((v) => v.errors.length === 0).length
  const invalidCount = validated.length - validCount

  const handleUpload = async () => {
    setUploading(true)
    const uploadResults = []

    for (const entry of validated) {
      if (entry.errors.length > 0) {
        uploadResults.push({ index: entry.index, name: entry.row.name, status: 'skipped', message: entry.errors.join('; ') })
        continue
      }
      try {
        const payload = rowToPayload(entry.row, entry.classId, entry.sectionId)
        const result = await studentsApi.create(payload)
        uploadResults.push({
          index: entry.index,
          name: entry.row.name,
          status: 'success',
          admissionNo: result.student?.admissionNo,
          parentAccount: result.parentAccount,
        })
      } catch (err) {
        uploadResults.push({ index: entry.index, name: entry.row.name, status: 'error', message: getErrorMessage(err, 'Failed') })
      }
    }

    setResults(uploadResults)
    setStep(STEPS.RESULT)
    setUploading(false)
  }

  const successCount = results.filter((r) => r.status === 'success').length

  return (
    <Modal open={open} onClose={handleClose} wide="xl" title="Bulk upload students" subtitle="Upload an Excel file (.xlsx) with student data">
      {step === STEPS.UPLOAD && (
        <div className="space-y-5">
          <div className="rounded-xl border-2 border-dashed border-line p-8 text-center">
            <Upload className="mx-auto h-10 w-10 text-ink/30 mb-3" />
            <p className="text-sm text-ink/70 mb-4">Select an Excel file (.xlsx) with student data</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="hidden"
              id="bulk-upload-file"
            />
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" icon={Download} onClick={() => downloadTemplate(classes)}>
                Download template
              </Button>
              <Button icon={Upload} onClick={() => fileRef.current?.click()}>
                Choose file
              </Button>
            </div>
          </div>

          {fileError && <Alert>{fileError}</Alert>}

          <div className="rounded-lg bg-surface p-4 text-xs text-ink/60 space-y-1">
            <p className="font-semibold text-ink/80 mb-2">Instructions:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Download the template and fill student details — one row per student.</li>
              <li>Class & Section names must match exactly as in your school setup.</li>
              <li>Gender: Male, Female, or Other. Date of birth: YYYY-MM-DD.</li>
              <li>Parent email is required — the system uses it to create or link a parent login.</li>
              <li>Maximum 200 students per upload.</li>
            </ol>
          </div>
        </div>
      )}

      {step === STEPS.PREVIEW && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink/70">Total: <span className="font-semibold text-ink">{validated.length}</span></span>
            <Badge tone="active">{validCount} valid</Badge>
            {invalidCount > 0 && <Badge tone="danger">{invalidCount} with errors</Badge>}
          </div>

          <div className="max-h-80 overflow-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="bg-surface sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Class</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Section</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Roll</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Parent</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Status</th>
                </tr>
              </thead>
              <tbody>
                {validated.map((entry) => {
                  const hasErrors = entry.errors.length > 0
                  return (
                    <tr key={entry.index} className={`border-t border-line ${hasErrors ? 'bg-coral/5' : ''}`}>
                      <td className="px-3 py-2 text-ink/50">{entry.index + 1}</td>
                      <td className="px-3 py-2 text-ink">{entry.row.name || '—'}</td>
                      <td className="px-3 py-2 text-ink/70">{entry.row.className || '—'}</td>
                      <td className="px-3 py-2 text-ink/70">{entry.row.sectionName || '—'}</td>
                      <td className="px-3 py-2 text-ink/70">{entry.row.rollNo || '—'}</td>
                      <td className="px-3 py-2 text-ink/70">{entry.row.parentName || '—'}</td>
                      <td className="px-3 py-2">
                        {hasErrors ? (
                          <span className="text-coral" title={entry.errors.join('\n')}>{entry.errors[0]}</span>
                        ) : (
                          <span className="text-emerald-600">OK</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {invalidCount > 0 && (
            <p className="text-xs text-ink/50">
              Rows with errors will be skipped. Only the {validCount} valid row{validCount !== 1 ? 's' : ''} will be uploaded.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={reset}>Back</Button>
            <Button onClick={handleUpload} loading={uploading} disabled={validCount === 0}>
              {uploading ? 'Uploading...' : `Upload ${validCount} student${validCount !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}

      {step === STEPS.RESULT && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            {successCount > 0 && <Badge tone="active">{successCount} created</Badge>}
            {results.filter((r) => r.status === 'error').length > 0 && (
              <Badge tone="danger">{results.filter((r) => r.status === 'error').length} failed</Badge>
            )}
            {results.filter((r) => r.status === 'skipped').length > 0 && (
              <Badge tone="neutral">{results.filter((r) => r.status === 'skipped').length} skipped</Badge>
            )}
          </div>

          <div className="max-h-80 overflow-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="bg-surface sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Adm. No.</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Result</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.index} className="border-t border-line">
                    <td className="px-3 py-2 text-ink/50">{r.index + 1}</td>
                    <td className="px-3 py-2 text-ink">{r.name || '—'}</td>
                    <td className="px-3 py-2 text-ink/70">{r.admissionNo || '—'}</td>
                    <td className="px-3 py-2">
                      {r.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-3.5 w-3.5" /> Created
                        </span>
                      )}
                      {r.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-coral" title={r.message}>
                          <XCircle className="h-3.5 w-3.5" /> {r.message}
                        </span>
                      )}
                      {r.status === 'skipped' && (
                        <span className="inline-flex items-center gap-1 text-ink/50" title={r.message}>
                          <AlertTriangle className="h-3.5 w-3.5" /> Skipped
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={reset}>Upload more</Button>
            <Button onClick={() => { onDone(successCount); handleClose() }}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
