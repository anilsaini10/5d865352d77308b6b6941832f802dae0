import { theme as defaultTheme } from './theme.js'

function hexToChannels(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

const radiusVar = (key) => (key === 'DEFAULT' ? '--radius' : `--radius-${key}`)

/**
 * Writes the theme tokens onto :root as CSS variables. Colors are stored as
 * "r g b" channels so Tailwind's opacity modifiers (bg-board/10) keep working.
 * Call once before render; call again with a new theme to restyle live.
 */
export function applyTheme(theme = defaultTheme, root = document.documentElement) {
  Object.entries(theme.colors).forEach(([name, hex]) => {
    root.style.setProperty(`--c-${name}`, hexToChannels(hex))
  })
  Object.entries(theme.fonts).forEach(([name, value]) => {
    root.style.setProperty(`--font-${name}`, value)
  })
  Object.entries(theme.fontSizes).forEach(([name, [size, lineHeight]]) => {
    root.style.setProperty(`--fs-${name}`, size)
    root.style.setProperty(`--lh-${name}`, lineHeight)
  })
  Object.entries(theme.radius).forEach(([name, value]) => {
    root.style.setProperty(radiusVar(name), value)
  })
}

export { radiusVar }
