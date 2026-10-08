import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_BASE_URL || ''

  // `npm run dev:live`: the browser calls same-origin /api and the dev server
  // forwards it to the deployed backend, so the backend's CORS whitelist
  // doesn't need to include localhost.
  const proxyRemote = command === 'serve' && /^https?:\/\//.test(apiUrl) && !/localhost|127\.0\.0\.1/.test(apiUrl)
  const { origin, pathname } = proxyRemote ? new URL(apiUrl) : {}

  return {
    plugins: [react()],
    define: proxyRemote ? { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify(pathname) } : {},
    server: proxyRemote
      ? { proxy: { [pathname]: { target: origin, changeOrigin: true, secure: true } } }
      : {},
  }
})
