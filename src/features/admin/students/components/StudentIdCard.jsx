import { useEffect, useRef, useState } from 'react'
import { Download, Printer, X } from 'lucide-react'
import QRCode from 'qrcode'
import { Modal, Button, PageLoader } from '../../../../components/ui.jsx'
import { useFetch } from '../../../../hooks/useFetch.js'
import { formatDay } from '../../../../utils/format.js'
import { GENDERS, enumMeta } from '../../constants.js'
import { studentsApi } from '../students.api.js'
import { schoolApi } from '../../school/school.api.js'

function buildQrData(student, school) {
  return JSON.stringify({
    type: 'STUDENT_ID',
    id: student.id,
    admissionNo: student.admissionNo,
    name: student.name,
    class: student.className,
    section: student.sectionName,
    school: school?.name,
    schoolCode: school?.code,
  })
}

function IdCardFront({ student, school, qrDataUrl }) {
  return (
    <div className="id-card-face id-card-front">
      <div className="id-header">
        {school?.logoUrl && <img src={school.logoUrl} alt="" className="id-logo" />}
        <div className="id-school-info">
          <h2 className="id-school-name">{school?.name || 'School Name'}</h2>
          {school?.addressLine1 && <p className="id-school-addr">{[school.addressLine1, school.city, school.state].filter(Boolean).join(', ')}</p>}
          {school?.contactPhone && <p className="id-school-addr">Ph: {school.contactPhone}</p>}
        </div>
      </div>

      <div className="id-badge-label">STUDENT IDENTITY CARD</div>

      <div className="id-body">
        <div className="id-photo-wrap">
          <div className="id-photo">
            <span className="id-photo-placeholder">{student.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        </div>
        <div className="id-details">
          <div className="id-student-name">{student.name}</div>
          <div className="id-field"><span className="id-label">Admission No.</span><span className="id-value">{student.admissionNo}</span></div>
          <div className="id-field"><span className="id-label">Class</span><span className="id-value">{student.className}{student.sectionName ? ` – ${student.sectionName}` : ''}</span></div>
          <div className="id-field"><span className="id-label">Roll No.</span><span className="id-value">{student.rollNo ?? '—'}</span></div>
          <div className="id-field"><span className="id-label">DOB</span><span className="id-value">{student.dateOfBirth ? formatDay(student.dateOfBirth) : '—'}</span></div>
          <div className="id-field"><span className="id-label">Blood Group</span><span className="id-value">{student.bloodGroup || '—'}</span></div>
        </div>
      </div>

      <div className="id-footer">
        <div className="id-validity">Valid: {new Date().getFullYear()}–{new Date().getFullYear() + 1}</div>
      </div>
    </div>
  )
}

function IdCardBack({ student, school, qrDataUrl }) {
  return (
    <div className="id-card-face id-card-back">
      <div className="id-header id-header-back">
        <h3 className="id-back-title">{school?.name || 'School Name'}</h3>
      </div>

      <div className="id-back-body">
        <div className="id-section">
          <div className="id-section-title">Parent / Guardian</div>
          <div className="id-field"><span className="id-label">Name</span><span className="id-value">{student.parentName}</span></div>
          <div className="id-field"><span className="id-label">Phone</span><span className="id-value">{student.parentPhone}</span></div>
        </div>

        {student.address && (
          <div className="id-section">
            <div className="id-section-title">Address</div>
            <p className="id-address-text">{student.address}</p>
          </div>
        )}

        <div className="id-qr-area">
          {qrDataUrl && <img src={qrDataUrl} alt="Student QR Code" className="id-qr" />}
          <p className="id-qr-hint">Scan for verification</p>
        </div>
      </div>

      <div className="id-footer id-footer-back">
        <div className="id-sign-line">
          <div className="id-sign-rule" />
          <span>Principal's Signature</span>
        </div>
      </div>
    </div>
  )
}

export default function StudentIdCard({ student: row, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const printRef = useRef(null)

  const { data: fullStudent, loading: studentLoading } = useFetch(
    () => studentsApi.get(row.id),
    [row?.id],
    { enabled: !!row, errorMessage: 'Could not load student.' }
  )

  const { data: school, loading: schoolLoading } = useFetch(
    () => schoolApi.get(),
    [],
    { errorMessage: 'Could not load school info.' }
  )

  const student = fullStudent ?? row
  const loading = studentLoading || schoolLoading

  useEffect(() => {
    if (!student || !school) return
    QRCode.toDataURL(buildQrData(student, school), { width: 140, margin: 1, color: { dark: '#111827', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [student, school])

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>ID Card - ${student.name}</title>${idCardStyles()}</head><body class="print-body">${content.innerHTML}</body></html>`)
    win.document.close()
    win.onafterprint = () => win.close()
    setTimeout(() => win.print(), 400)
  }

  if (!row) return null

  return (
    <Modal open onClose={onClose} wide title="Student ID Card" subtitle={student.name}>
      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>Print</Button>
          </div>
          <div ref={printRef}>
            <style dangerouslySetInnerHTML={{ __html: idCardCss() }} />
            <div className="id-card-container">
              <IdCardFront student={student} school={school} qrDataUrl={qrDataUrl} />
              <IdCardBack student={student} school={school} qrDataUrl={qrDataUrl} />
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}

function idCardCss() {
  return `
    .id-card-container {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      justify-content: center;
      padding: 8px 0;
    }
    .id-card-face {
      width: 340px;
      height: 540px;
      border-radius: 16px;
      border: 2px solid var(--color-line);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #fff;
      font-family: var(--font-body);
      position: relative;
    }
    .id-header {
      background: var(--color-board);
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .id-header-back {
      justify-content: center;
      padding: 12px 16px;
    }
    .id-logo {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: contain;
      background: #fff;
      padding: 3px;
      flex-shrink: 0;
    }
    .id-school-info {
      min-width: 0;
    }
    .id-school-name {
      font-family: var(--font-display);
      font-size: 15px;
      font-weight: 700;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .id-school-addr {
      font-size: 10px;
      opacity: 0.8;
      margin-top: 2px;
      line-height: 1.3;
    }
    .id-back-title {
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 700;
      text-align: center;
    }
    .id-badge-label {
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 6px 0;
      background: var(--color-chalk);
      color: var(--color-chalk-ink);
    }
    .id-body {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .id-photo-wrap {
      flex-shrink: 0;
    }
    .id-photo {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 3px solid var(--color-board);
      background: linear-gradient(135deg, rgba(79,70,229,0.08), rgba(79,70,229,0.18));
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .id-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .id-photo-placeholder {
      font-family: var(--font-display);
      font-size: 36px;
      font-weight: 700;
      color: var(--color-board);
      opacity: 0.6;
    }
    .id-details {
      width: 100%;
    }
    .id-student-name {
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 700;
      color: var(--color-ink);
      text-align: center;
      margin-bottom: 10px;
    }
    .id-field {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dashed var(--color-line);
      font-size: 12px;
    }
    .id-label {
      color: rgba(17,24,39,0.5);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.04em;
    }
    .id-value {
      color: var(--color-ink);
      font-weight: 600;
    }
    .id-footer {
      padding: 8px 16px;
      border-top: 1px solid var(--color-line);
      background: rgba(79,70,229,0.04);
    }
    .id-footer-back {
      padding: 12px 16px;
    }
    .id-validity {
      font-size: 10px;
      font-weight: 600;
      color: rgba(17,24,39,0.5);
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .id-back-body {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .id-section {
      border: 1px solid var(--color-line);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .id-section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-board);
      margin-bottom: 6px;
    }
    .id-address-text {
      font-size: 11px;
      color: rgba(17,24,39,0.7);
      line-height: 1.4;
    }
    .id-qr-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .id-qr {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      border: 1px solid var(--color-line);
    }
    .id-qr-hint {
      font-size: 9px;
      color: rgba(17,24,39,0.4);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
    }
    .id-sign-line {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      font-size: 10px;
      color: rgba(17,24,39,0.5);
    }
    .id-sign-rule {
      width: 140px;
      border-top: 1px solid rgba(17,24,39,0.3);
    }
  `
}

function idCardStyles() {
  return `<style>
    @page { size: auto; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body.print-body {
      display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; padding: 8px;
      font-family: 'Inter', -apple-system, sans-serif;
    }
    ${idCardCss()}
    :root {
      --color-board: #4F46E5;
      --color-chalk: #F59E0B;
      --color-chalk-ink: #111827;
      --color-ink: #111827;
      --color-line: #E5E7EB;
      --font-display: 'Fraunces', serif;
      --font-body: 'Inter', sans-serif;
    }
  </style>`
}
