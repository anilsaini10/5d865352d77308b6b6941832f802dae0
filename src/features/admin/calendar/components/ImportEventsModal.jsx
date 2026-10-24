import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { Alert, Badge, Button, Modal, inputClass } from '../../../../components/ui.jsx'
import { useToast } from '../../../../context/ToastContext.jsx'
import { getErrorCode, getErrorMessage } from '../../../../api/httpClient.js'
import { eventsApi } from '../../events/events.api.js'
import { COLUMNS, MAX_ROWS, checkRows, downloadTemplate, parseEventsFile, toPayload } from '../excel.js'

const cell = `${inputClass} !py-1 !px-2 !text-xs`

/** Upload → preview → validate (dry run) → fix → import. Nothing is saved unless every row is valid. */
export default function ImportEventsModal({ open, onClose, onImported }) {
  const { notify } = useToast()
  const fileRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([])
  const [report, setReport] = useState(null) // { valid, invalid, byIndex: { [i]: string[] } }
  const [dirty, setDirty] = useState(false) // edited since the last validation
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const reset = () => {
    setFileName('')
    setRows([])
    setReport(null)
    setDirty(false)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }
  const close = () => {
    if (busy) return
    reset()
    onClose()
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    reset()
    setBusy('parse')
    try {
      const { rows: parsed, missing } = await parseEventsFile(file)
      if (missing.length) setError(`Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Download the template to see the expected headers.`)
      else if (parsed.length === 0) setError('No rows found in the first sheet.')
      else if (parsed.length > MAX_ROWS) setError(`This file has ${parsed.length} rows. The limit is ${MAX_ROWS} per import — split it into smaller files.`)
      else {
        setRows(parsed)
        setFileName(file.name)
      }
    } catch (err) {
      // assertSafeFile throws user-friendly messages; anything else is an unreadable file
      setError(err?.safe ? err.message : 'Could not read that file. Use a plain .xlsx, .xls or .csv file.')
    } finally {
      setBusy('')
    }
  }

  const edit = (i, key, value) => {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)))
    setDirty(true)
    setReport((rep) => rep && { ...rep, byIndex: { ...rep.byIndex, [i]: undefined } })
  }
  const removeRow = (i) => {
    setRows((rs) => rs.filter((_, idx) => idx !== i))
    setReport(null) // indexes shifted — validate again
    setDirty(true)
  }

  const toReport = (results = []) => {
    const byIndex = {}
    results.forEach((r) => {
      if (r.status === 'error') byIndex[r.index] = r.errors?.length ? r.errors : ['Invalid row']
    })
    return { byIndex, valid: results.filter((r) => r.status !== 'error').length, invalid: Object.keys(byIndex).length }
  }

  /** Local security/content check; shows problems on the rows and returns true when clean. Nothing is sent if it fails. */
  const passesLocalCheck = () => {
    const bad = checkRows(rows)
    const count = Object.keys(bad).length
    if (!count) return true
    setReport({ byIndex: bad, valid: rows.length - count, invalid: count })
    setDirty(false)
    setError('Some rows contain unsafe or invalid content, so nothing was sent to the server. Fix the highlighted rows and try again.')
    return false
  }

  const validate = async () => {
    setError('')
    if (!passesLocalCheck()) return
    setBusy('validate')
    try {
      const res = await eventsApi.bulk(toPayload(rows), { dryRun: true })
      setReport(toReport(res.results))
      setDirty(false)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not validate the file.'))
    } finally {
      setBusy('')
    }
  }

  const doImport = async () => {
    setError('')
    if (!passesLocalCheck()) return
    setBusy('import')
    try {
      const res = await eventsApi.bulk(toPayload(rows))
      notify(`${res.created ?? rows.length} calendar entr${(res.created ?? rows.length) === 1 ? 'y' : 'ies'} imported.`, 'success')
      onImported()
      reset()
      onClose()
    } catch (err) {
      const results = err?.response?.data?.error?.details?.results
      if (getErrorCode(err) === 'BULK_VALIDATION_FAILED' && results) {
        setReport(toReport(results))
        setDirty(false)
        setError('Some rows are invalid, so nothing was imported. Fix the highlighted rows and try again.')
      } else {
        setError(getErrorMessage(err, 'Could not import the file.'))
      }
    } finally {
      setBusy('')
    }
  }

  const canImport = rows.length > 0 && !dirty && report?.invalid === 0

  return (
    <Modal open={open} onClose={close} wide="xl" title="Import from Excel" subtitle="Plan a whole year at once — nothing is saved until every row is valid">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg bg-board hover:bg-board-light text-on-board text-sm font-semibold px-4 py-2.5 cursor-pointer">
            <Upload size={16} /> {fileName ? 'Choose another file' : 'Choose Excel file'}
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={onFile} disabled={!!busy} />
          </label>
          <Button variant="secondary" icon={Download} onClick={downloadTemplate}>Download template</Button>
          {fileName && <span className="inline-flex items-center gap-1.5 text-sm text-ink/60"><FileSpreadsheet size={15} /> {fileName} · {rows.length} rows</span>}
        </div>

        {rows.length === 0 && !error && (
          <p className="text-sm text-ink/55">
            Columns: <strong>title</strong>, description, <strong>eventType</strong> (e.g. Holiday, Govt Holiday, Vacation, Exam, PTM, Function), audience (All / Teachers / Parents),
            <strong> startDate</strong>, endDate. Dates can be 15/08/2026, 2026-08-15 or a real Excel date. Leave endDate empty for a one-day entry. Rows already on the calendar are rejected as duplicates.
          </p>
        )}

        <Alert>{error}</Alert>

        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {report && !dirty ? (
                <>
                  <Badge tone="success">Valid: {report.valid}</Badge>
                  <Badge tone={report.invalid ? 'danger' : 'neutral'}>Invalid: {report.invalid}</Badge>
                </>
              ) : (
                <Badge tone="warning">{dirty && report ? 'Edited — validate again' : 'Not validated yet'}</Badge>
              )}
              <span className="text-xs text-ink/45">Excel row = row number below (the header is row 1).</span>
            </div>

            <div className="overflow-auto max-h-[45vh] rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-paper">
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/45">
                    <th className="px-3 py-2 font-semibold">Row</th>
                    {COLUMNS.map((c) => <th key={c.key} className="px-2 py-2 font-semibold whitespace-nowrap">{c.label}</th>)}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const errs = report?.byIndex[i]
                    return (
                      <FragmentRows key={i} errors={errs} cols={COLUMNS.length + 2}>
                        <td className="px-3 py-1.5 text-xs text-ink/50">{i + 2}</td>
                        {COLUMNS.map((c) => (
                          <td key={c.key} className="px-1.5 py-1">
                            <input aria-label={`${c.label}, row ${i + 2}`} className={`${cell} ${c.key === 'title' ? 'min-w-[11rem]' : c.key === 'description' ? 'min-w-[9rem]' : 'w-32'}`} value={r[c.key]} onChange={(e) => edit(i, c.key, e.target.value)} disabled={!!busy} />
                          </td>
                        ))}
                        <td className="px-2"><button type="button" className="text-xs text-ink/40 hover:text-coral" onClick={() => removeRow(i)} aria-label={`Remove row ${i + 2}`}>Remove</button></td>
                      </FragmentRows>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" loading={busy === 'validate'} disabled={!!busy} onClick={validate}>Validate</Button>
              <Button loading={busy === 'import'} disabled={!!busy || !canImport} onClick={doImport}>Import {rows.length} row{rows.length === 1 ? '' : 's'}</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function FragmentRows({ errors, cols, children }) {
  return (
    <>
      <tr className={`border-b border-line ${errors ? 'bg-coral/5' : ''}`}>{children}</tr>
      {errors && (
        <tr className="bg-coral/5 border-b border-line">
          <td colSpan={cols} className="px-3 pb-1.5 text-xs font-medium text-coral">{errors.join(' · ')}</td>
        </tr>
      )}
    </>
  )
}
