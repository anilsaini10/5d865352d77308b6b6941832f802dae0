import { sanitizeHtml } from '../utils/sanitizeHtml.js'

/** Renders rich-text HTML (sanitized again on the client as a second layer). Links open in a new tab. */
export default function RichContent({ html, className = '' }) {
  return <div className={`rich-content ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
}
