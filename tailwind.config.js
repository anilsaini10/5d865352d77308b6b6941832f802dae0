/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F3',
        board: {
          DEFAULT: '#1F3A34',
          light: '#2C4F47',
          dark: '#152A25',
        },
        chalk: '#F2C94C',
        coral: '#E2725B',
        ink: '#22281F',
        line: '#E4DFD3',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(31,58,52,0.06), 0 1px 0 rgba(31,58,52,0.04)',
        pop: '0 12px 32px rgba(31,58,52,0.16)',
      },
      backgroundImage: {
        chalkline: "linear-gradient(90deg, transparent, rgba(242,201,76,0.5), transparent)",
      },
    },
  },
  plugins: [],
}
