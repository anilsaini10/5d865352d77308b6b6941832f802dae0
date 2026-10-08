import { theme } from './src/theme/theme.js'
import { radiusVar } from './src/theme/applyTheme.js'

// Every value below points at a CSS variable written by applyTheme() from
// src/theme/theme.js — edit colors/fonts/sizes there, not here.
const color = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: color('paper'),
        surface: color('surface'),
        ink: color('ink'),
        line: { DEFAULT: color('line'), strong: color('line-strong') },
        board: {
          DEFAULT: color('board'),
          light: color('board-light'),
          dark: color('board-dark'),
        },
        'on-board': color('on-board'),
        chalk: { DEFAULT: color('chalk'), ink: color('chalk-ink') },
        coral: color('coral'),
        success: color('success'),
        warning: color('warning'),
        info: color('info'),
      },
      fontFamily: Object.fromEntries(Object.keys(theme.fonts).map((k) => [k, `var(--font-${k})`])),
      fontSize: Object.fromEntries(
        Object.keys(theme.fontSizes).map((k) => [k, [`var(--fs-${k})`, { lineHeight: `var(--lh-${k})` }]])
      ),
      borderRadius: Object.fromEntries(Object.keys(theme.radius).map((k) => [k, `var(${radiusVar(k)})`])),
      boxShadow: {
        card: '0 1px 2px rgb(var(--c-board) / 0.06), 0 1px 0 rgb(var(--c-board) / 0.04)',
        pop: '0 12px 32px rgb(var(--c-board) / 0.16)',
      },
    },
  },
  plugins: [],
}
