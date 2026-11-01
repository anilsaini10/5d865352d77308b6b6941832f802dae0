import { theme } from '../theme/theme.js'

const COLORS = theme.colors
const FONTS = theme.fonts

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const INK = hexToRgb(COLORS.ink)
const BOARD = hexToRgb(COLORS.board)
const LINE = hexToRgb(COLORS.line)

/**
 * Generates a printable PDF from table data and opens the browser print dialog.
 *
 * @param {Object} opts
 * @param {string} opts.title - Page title / heading
 * @param {string} [opts.subtitle] - Line below the title (school name, date range, etc.)
 * @param {{ key: string, label: string, align?: 'left'|'center'|'right', width?: string }[]} opts.columns
 * @param {Record<string, any>[]} opts.rows - One object per row; keys must match column.key
 * @param {string} [opts.fileName] - Suggested download name (used as <title>)
 * @param {{ label: string, value: string|number }[]} [opts.summary] - Key-value pairs shown above the table
 * @param {string} [opts.footerNote] - Small text at the bottom of the page
 */
export function printPdf({ title, subtitle, columns, rows, fileName, summary, footerNote }) {
  const doc = window.open('', '_blank')
  if (!doc) return

  const alignStyle = (a) => (a === 'right' ? 'text-align:right' : a === 'center' ? 'text-align:center' : 'text-align:left')

  const headerCells = columns
    .map((c) => `<th style="padding:8px 12px;${alignStyle(c.align)};${c.width ? `width:${c.width}` : ''}">${c.label}</th>`)
    .join('')

  const bodyRows = rows
    .map(
      (r, i) =>
        `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">` +
        columns.map((c) => `<td style="padding:8px 12px;${alignStyle(c.align)}">${r[c.key] ?? '—'}</td>`).join('') +
        '</tr>'
    )
    .join('')

  const summaryHtml = summary
    ? `<div style="display:flex;flex-wrap:wrap;gap:24px;margin-bottom:16px">${summary
        .map((s) => `<div><span style="color:rgba(${INK},0.5);font-size:12px;text-transform:uppercase;letter-spacing:0.05em">${s.label}</span><br/><span style="font-size:18px;font-weight:600;color:rgb(${INK})">${s.value}</span></div>`)
        .join('')}</div>`
    : ''

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${fileName || title}</title>
<style>
  @page { size: A4 landscape; margin: 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${FONTS.body}; color: rgb(${INK}); font-size: 13px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; }
  th { background: rgb(${BOARD}); color: #fff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
  td { border-bottom: 1px solid rgb(${LINE}); font-size: 12px; color: rgba(${INK},0.8); }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
  <div>
    <h1 style="font-size:20px;font-weight:700;color:rgb(${INK})">${title}</h1>
    ${subtitle ? `<p style="font-size:13px;color:rgba(${INK},0.55);margin-top:2px">${subtitle}</p>` : ''}
  </div>
  <div style="text-align:right">
    <p style="font-size:11px;color:rgba(${INK},0.45)">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>
    <button class="no-print" onclick="window.print()" style="margin-top:8px;padding:8px 20px;background:rgb(${BOARD});color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Print / Save PDF</button>
  </div>
</div>
${summaryHtml}
<table>
  <thead><tr>${headerCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
${rows.length === 0 ? '<p style="text-align:center;padding:32px;color:rgba(' + INK + ',0.4)">No records to display.</p>' : ''}
<div style="margin-top:16px;display:flex;justify-content:space-between;font-size:11px;color:rgba(${INK},0.4)">
  <span>${footerNote || ''}</span>
  <span>Total: ${rows.length} record${rows.length === 1 ? '' : 's'}</span>
</div>
</body>
</html>`

  doc.document.write(html)
  doc.document.close()
}
