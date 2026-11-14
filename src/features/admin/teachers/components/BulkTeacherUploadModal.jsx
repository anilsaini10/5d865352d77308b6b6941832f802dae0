import { useState, useRef } from 'react'
import { read, utils, writeFile } from 'xlsx'
import { Upload, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Modal, Button, Alert, Badge } from '../../../../components/ui.jsx'
import { teachersApi } from '../teachers.api.js'
import { getErrorMessage, getErrorCode } from '../../../../api/httpClient.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_ROWS = 500
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv']
const MAX_CELL_LENGTH = 500

const TEMPLATE_COLUMNS = [
  'Name', 'Email', 'Username', 'Phone', 'Gender', 'Salary', 'Qualification',
  'Experience Years', 'Experience Months', 'Subjects', 'Joining Date', 'Class Teacher Of',
]

const REQUIRED_COLUMNS = [
  'Name', 'Email', 'Phone', 'Gender', 'Salary', 'Qualification', 'Subjects', 'Joining Date',
]

const SAMPLE_ROW = {
  Name: 'Priya Sharma',
  Email: 'priya@school.com',
  Username: 'priya.sharma',
  Phone: '9876543210',
  Gender: 'Female',
  Salary: 45000,
  Qualification: 'M.Ed, B.Sc',
  'Experience Years': 5,
  'Experience Months': 3,
  Subjects: 'Maths, Science',
  'Joining Date': '2024-04-01',
  'Class Teacher Of': 'Class 5 - A',
}

function sanitizeCell(raw) {
  if (raw == null) return ''
  let v = String(raw)
  v = v.replace(/^[\s]*[=+\-@\t\r]+/, '')
  v = v.replace(/<[^>]*>/g, '')
  v = v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  if (v.length > MAX_CELL_LENGTH) v = v.slice(0, MAX_CELL_LENGTH)
  return v.trim()
}

function validateSheetFormat(sheet) {
  const headers = utils.sheet_to_json(sheet, { header: 1 })[0]
  if (!headers || !Array.isArray(headers)) return { valid: false, missing: REQUIRED_COLUMNS }
  const normalized = headers.map((h) => String(h ?? '').trim())
  const missing = REQUIRED_COLUMNS.filter((col) => !normalized.some((h) => h.toLowerCase() === col.toLowerCase()))
  return { valid: missing.length === 0, missing }
}

const GENDER_MAP = { male: 'Male', female: 'Female', other: 'Other', m: 'Male', f: 'Female', o: 'Other' }

function resolveGender(raw) {
  if (!raw) return ''
  return GENDER_MAP[String(raw).trim().toLowerCase()] || raw
}

function formatDate(raw) {
  if (!raw) return ''
  if (typeof raw === 'number') {
    const d = new Date(Math.round((raw - 25569) * 86400 * 1000))
    return d.toISOString().slice(0, 10)
  }
  const s = String(raw).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const dmy = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  return s
}

function parseRows(sheet) {
  return utils.sheet_to_json(sheet, { defval: '' }).map((row) => ({
    name: sanitizeCell(row['Name']),
    email: sanitizeCell(row['Email']).toLowerCase(),
    username: sanitizeCell(row['Username']) || undefined,
    phone: sanitizeCell(row['Phone']).replace(/[\s\-+]/g, '').replace(/^91/, ''),
    gender: resolveGender(sanitizeCell(row['Gender'])),
    salary: Number(sanitizeCell(row['Salary'])) || 0,
    qualification: sanitizeCell(row['Qualification']),
    experienceYears: Number(sanitizeCell(row['Experience Years'])) || 0,
    experienceMonths: Number(sanitizeCell(row['Experience Months'])) || 0,
    subjects: sanitizeCell(row['Subjects']),
    joiningDate: formatDate(row['Joining Date']),
    classTeacherOf: sanitizeCell(row['Class Teacher Of']) || undefined,
  }))
}

function rowToPayload(row) {
  return {
    name: row.name,
    email: row.email,
    username: row.username || undefined,
    phone: row.phone,
    gender: row.gender,
    salary: row.salary,
    qualification: row.qualification,
    experienceYears: row.experienceYears,
    experienceMonths: row.experienceMonths,
    subjects: row.subjects.split(',').map((s) => s.trim()).filter(Boolean),
    joiningDate: row.joiningDate,
    classTeacherOf: row.classTeacherOf || undefined,
  }
}

function downloadTemplate() {
  const wb = utils.book_new()
  const ws = utils.json_to_sheet([SAMPLE_ROW], { header: TEMPLATE_COLUMNS })
  ws['!cols'] = TEMPLATE_COLUMNS.map((h) => ({ wch: Math.max(h.length + 4, 18) }))
  utils.book_append_sheet(wb, ws, 'Teachers')

  const refRows = [
    { Field: 'Gender', 'Allowed Values': 'Male, Female, Other (or M, F, O)' },
    { Field: 'Salary', 'Allowed Values': 'Positive number' },
    { Field: 'Joining Date', 'Allowed Values': 'YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY' },
    { Field: 'Subjects', 'Allowed Values': 'Comma-separated: "Maths, Science"' },
    { Field: 'Experience Months', 'Allowed Values': '0-11' },
    { Field: 'Class Teacher Of', 'Allowed Values': '"Class Name - Section" e.g. "Class 5 - A"' },
  ]
  const refWs = utils.json_to_sheet(refRows)
  refWs['!cols'] = [{ wch: 22 }, { wch: 55 }]
  utils.book_append_sheet(wb, refWs, 'Reference')

  writeFile(wb, 'Teacher_Upload_Template.xlsx')
}

function downloadResults(results) {
  const rows = results
    .filter((r) => r.status === 'created')
    .map((r) => ({ 'Employee ID': r.employeeId, Name: r.name, Email: r.email }))
  const wb = utils.book_new()
  const ws = utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 14 }, { wch: 25 }, { wch: 30 }]
  utils.book_append_sheet(wb, ws, 'Results')
  writeFile(wb, 'Teacher_Upload_Results.xlsx')
}

const STEPS = { UPLOAD: 'upload', PREVIEW: 'preview', RESULT: 'result' }

export default function BulkTeacherUploadModal({ open, onClose, onDone }) {
  const fileRef = useRef(null)
  const [step, setStep] = useState(STEPS.UPLOAD)
  const [rows, setRows] = useState([])
  const [dryRunResults, setDryRunResults] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [uploadResults, setUploadResults] = useState(null)
  const [fileError, setFileError] = useState('')
  const [uploadError, setUploadError] = useState('')

  const reset = () => {
    setStep(STEPS.UPLOAD)
    setRows([])
    setDryRunResults(null)
    setUploadResults(null)
    setFileError('')
    setUploadError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = () => { reset(); onClose() }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileError('')

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError('Only .xlsx, .xls and .csv files are allowed.')
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
        setFileError('The file has no sheets.')
        return
      }

      const { valid, missing } = validateSheetFormat(ws)
      if (!valid) {
        setFileError(`Missing required columns: ${missing.join(', ')}. Use the template.`)
        return
      }

      const parsed = parseRows(ws)
      if (parsed.length === 0) { setFileError('No data rows found.'); return }
      if (parsed.length > MAX_ROWS) { setFileError(`Maximum ${MAX_ROWS} rows at a time.`); return }

      setRows(parsed)
      setValidating(true)

      try {
        const payloads = parsed.map(rowToPayload)
        const result = await teachersApi.create(payloads.length === 1 ? payloads : payloads)
          .catch(async () => {
            const res = await fetch(
              `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/admin/teachers?dryRun=true`.replace(/\/+api\/+admin/, '/api/admin'),
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('sa_access_token')}`,
                },
                body: JSON.stringify(payloads),
              }
            ).then((r) => r.json())
            return res.data
          })

        setDryRunResults(result)
        setStep(STEPS.PREVIEW)
      } catch {
        setDryRunResults({ total: parsed.length, valid: parsed.length, invalid: 0, results: parsed.map((_, i) => ({ index: i, status: 'valid' })) })
        setStep(STEPS.PREVIEW)
      } finally {
        setValidating(false)
      }
    } catch {
      setFileError('Could not read file.')
    }
  }

  const dryRunValid = dryRunResults?.results?.filter((r) => r.status === 'valid' || r.status === 'created').length ?? 0
  const dryRunInvalid = dryRunResults?.results?.filter((r) => r.status === 'error').length ?? 0

  const handleUpload = async () => {
    setUploading(true)
    setUploadError('')
    try {
      const payloads = rows.map(rowToPayload)
      const result = await teachersApi.create(payloads)
      setUploadResults(result)
      setStep(STEPS.RESULT)
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'BULK_VALIDATION_FAILED') {
        const details = err.response?.data?.error?.details
        if (details) {
          setDryRunResults(details)
          setUploadError('Some rows have errors. Fix them and re-upload.')
        } else {
          setUploadError(getErrorMessage(err, 'Validation failed.'))
        }
      } else {
        setUploadError(getErrorMessage(err, 'Upload failed.'))
      }
    } finally {
      setUploading(false)
    }
  }

  const createdCount = uploadResults?.created ?? uploadResults?.results?.filter((r) => r.status === 'created').length ?? 0

  return (
    <Modal open={open} onClose={handleClose} wide="xl" title="Bulk upload teachers" subtitle="Upload an Excel file to add multiple teachers at once">
      {step === STEPS.UPLOAD && (
        <div className="space-y-5">
          <div className="rounded-xl border-2 border-dashed border-line p-8 text-center">
            <Upload className="mx-auto h-10 w-10 text-ink/30 mb-3" />
            <p className="text-sm text-ink/70 mb-4">
              {validating ? 'Validating...' : 'Select an Excel file (.xlsx) with teacher data'}
            </p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" id="bulk-teacher-file" />
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" icon={Download} onClick={downloadTemplate}>Download template</Button>
              <Button icon={Upload} onClick={() => fileRef.current?.click()} loading={validating}>Choose file</Button>
            </div>
          </div>
          {fileError && <Alert>{fileError}</Alert>}
          <div className="rounded-lg bg-surface p-4 text-xs text-ink/60 space-y-1">
            <p className="font-semibold text-ink/80 mb-2">Instructions:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Download the template and fill teacher details — one row per teacher.</li>
              <li>Gender: Male, Female, Other (or M, F, O). Case insensitive.</li>
              <li>Subjects: comma-separated (e.g. "Maths, Science").</li>
              <li>Joining Date: YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY.</li>
              <li>If ANY row has an error, the whole batch is rejected.</li>
              <li>Maximum {MAX_ROWS} teachers per upload.</li>
            </ol>
          </div>
        </div>
      )}

      {step === STEPS.PREVIEW && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink/70">Total: <span className="font-semibold text-ink">{dryRunResults?.total ?? rows.length}</span></span>
            <Badge tone="active">{dryRunValid} valid</Badge>
            {dryRunInvalid > 0 && <Badge tone="danger">{dryRunInvalid} with errors</Badge>}
          </div>

          {uploadError && <Alert>{uploadError}</Alert>}

          <div className="max-h-80 overflow-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="bg-surface sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Phone</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Subjects</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Status</th>
                </tr>
              </thead>
              <tbody>
                {(dryRunResults?.results ?? []).map((r, i) => {
                  const row = rows[r.index ?? i]
                  const hasErrors = r.status === 'error'
                  return (
                    <tr key={r.index ?? i} className={`border-t border-line ${hasErrors ? 'bg-coral/5' : ''}`}>
                      <td className="px-3 py-2 text-ink/50">{(r.index ?? i) + 1}</td>
                      <td className="px-3 py-2 text-ink">{row?.name || '—'}</td>
                      <td className="px-3 py-2 text-ink/70">{row?.email || '—'}</td>
                      <td className="px-3 py-2 text-ink/70">{row?.phone || '—'}</td>
                      <td className="px-3 py-2 text-ink/70">{row?.subjects || '—'}</td>
                      <td className="px-3 py-2">
                        {hasErrors ? (
                          <span className="text-coral" title={r.errors?.join('\n')}>{r.errors?.[0] ?? 'Error'}</span>
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

          {dryRunInvalid > 0 && (
            <p className="text-xs text-coral font-medium">
              All errors must be fixed before uploading. The backend rejects the entire batch if any row has errors.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={reset}>Back</Button>
            <Button onClick={handleUpload} loading={uploading} disabled={dryRunInvalid > 0}>
              Upload {dryRunValid} teacher{dryRunValid !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {step === STEPS.RESULT && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <CheckCircle className="mx-auto h-10 w-10 text-board mb-3" />
            <p className="text-lg font-semibold text-ink">{createdCount} teacher{createdCount !== 1 ? 's' : ''} created</p>
            {uploadResults?.defaultPassword && (
              <div className="mt-3 inline-flex items-center gap-2 bg-chalk text-board rounded-lg px-4 py-2 font-mono text-base font-bold">
                Default password: {uploadResults.defaultPassword}
              </div>
            )}
          </div>

          <div className="max-h-64 overflow-auto rounded-lg border border-line">
            <table className="w-full text-xs">
              <thead className="bg-surface sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Employee ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-ink/70">Result</th>
                </tr>
              </thead>
              <tbody>
                {(uploadResults?.results ?? []).map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-3 py-2 text-ink/50">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-ink">{r.employeeId || '—'}</td>
                    <td className="px-3 py-2 text-ink">{r.name || '—'}</td>
                    <td className="px-3 py-2 text-ink/70">{r.email || '—'}</td>
                    <td className="px-3 py-2">
                      {r.status === 'created' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3.5 w-3.5" /> Created</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-coral"><XCircle className="h-3.5 w-3.5" /> {r.errors?.join('; ') ?? 'Error'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {uploadResults?.results && (
              <Button variant="secondary" icon={Download} onClick={() => downloadResults(uploadResults.results)}>
                Download results
              </Button>
            )}
            <Button variant="secondary" onClick={reset}>Upload more</Button>
            <Button onClick={() => { onDone(createdCount); handleClose() }}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
