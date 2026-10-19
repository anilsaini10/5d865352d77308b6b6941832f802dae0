const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'P', 'BR', 'DIV', 'UL', 'OL', 'LI', 'H3', 'H4', 'BLOCKQUOTE', 'A', 'SPAN'])
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'SVG', 'MATH', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT'])
const SAFE_URL = /^(https?:|mailto:)/i

/**
 * Whitelist sanitizer for the rich-text content we render with dangerouslySetInnerHTML.
 * Keeps basic formatting, strips every attribute except a safe `href` on links.
 */
export function sanitizeHtml(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')

  const clean = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) return
      if (child.nodeType !== Node.ELEMENT_NODE || DROP.has(child.tagName)) {
        child.remove()
        return
      }
      clean(child)
      if (child.tagName === 'STRIKE' || child.tagName === 'DEL') {
        const s = doc.createElement('s') // execCommand('strikeThrough') emits <strike>; the server only allows <s>
        s.append(...Array.from(child.childNodes))
        child.replaceWith(s)
        return
      }
      if (!ALLOWED.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes)) // unknown tag → keep its content
        return
      }
      const href = child.tagName === 'A' ? child.getAttribute('href') : null
      Array.from(child.attributes).forEach((a) => child.removeAttribute(a.name))
      if (child.tagName === 'A') {
        if (href && SAFE_URL.test(href.trim())) {
          child.setAttribute('href', href.trim())
          child.setAttribute('target', '_blank')
          child.setAttribute('rel', 'noopener noreferrer')
        } else {
          child.replaceWith(...Array.from(child.childNodes))
        }
      }
    })
  }
  clean(doc.body)
  return doc.body.innerHTML
}

/** True when the HTML has no visible text. */
export function isHtmlEmpty(html) {
  if (!html) return true
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  return doc.body.textContent.trim() === ''
}
