import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar.jsx'

export default function AppShell({ title, subtitle, actions, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur border-b border-line">
          <div className="flex items-center justify-between gap-4 px-5 sm:px-8 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-ink/70 hover:bg-line/50"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink truncate">{title}</h1>
                {subtitle && <p className="text-sm text-ink/55 mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
          </div>
        </header>

        <main className="flex-1 px-5 sm:px-8 py-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
