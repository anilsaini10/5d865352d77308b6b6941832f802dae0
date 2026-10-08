/**
 * Single source of truth for the panel's look. Every Tailwind color, font,
 * font size and radius used in the app reads from these values through CSS
 * variables (see applyTheme.js + tailwind.config.js), so swapping the mobile
 * app's palette in later means editing only this file — no component changes.
 *
 * Colors are plain hex. Token names are semantic; the comment next to each
 * says what it's used for so it can be matched to the mobile app's palette.
 */
export const theme = {
  colors: {
    paper: '#F9FAFB', // app background
    surface: '#FFFFFF', // cards, inputs, table bodies
    ink: '#111827', // primary text (muted text = ink at lower opacity)
    line: '#E5E7EB', // borders, dividers
    'line-strong': '#D1D5DB', // scrollbar thumb, perforated edges

    board: '#4F46E5', // primary brand color — buttons, sidebar, links (indigo-600)
    'board-light': '#6366F1', // primary hover (indigo-500)
    'board-dark': '#4338CA', // primary pressed / borders on primary (indigo-700)
    'on-board': '#FFFFFF', // text/icons placed on primary

    chalk: '#F59E0B', // accent — highlights, active nav underline, passwords (amber-500)
    'chalk-ink': '#111827', // readable text on a light accent background

    coral: '#EF4444', // danger / error / destructive actions
    success: '#22C55E', // present, graded, approved
    warning: '#F97316', // late, pending, scheduled
    info: '#3B82F6', // leave, informational
  },

  fonts: {
    display: '"Fraunces", serif', // headings
    body: '"Inter", sans-serif', // everything else
    mono: '"JetBrains Mono", monospace', // ids, passwords, codes
  },

  // [fontSize, lineHeight] — overrides Tailwind's text-xs … text-4xl scale.
  fontSizes: {
    xs: ['0.75rem', '1rem'],
    sm: ['0.875rem', '1.25rem'],
    base: ['1rem', '1.5rem'],
    lg: ['1.125rem', '1.75rem'],
    xl: ['1.25rem', '1.75rem'],
    '2xl': ['1.5rem', '2rem'],
    '3xl': ['1.875rem', '2.25rem'],
    '4xl': ['2.25rem', '2.5rem'],
  },

  // Overrides Tailwind's rounded-sm … rounded-2xl scale.
  radius: {
    sm: '0.25rem',
    DEFAULT: '0.375rem',
    md: '0.5rem',
    lg: '0.625rem',
    xl: '0.875rem',
    '2xl': '1.125rem',
  },
}
