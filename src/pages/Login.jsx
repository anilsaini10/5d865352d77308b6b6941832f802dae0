import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { inputClass } from '../components/ui.jsx'

export default function Login() {
  const { login, user, demo, demoPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to={location.state?.from || '/'} replace />
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = login(email, password)
    if (result.ok) {
      navigate(location.state?.from || '/', { replace: true })
    } else {
      setError(result.error)
    }
  }

  const fillDemo = () => {
    setEmail(demo.email)
    setPassword(demoPassword)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-board flex items-center justify-center mb-4 shadow-card">
            <GraduationCap size={24} className="text-chalk" strokeWidth={2.3} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Vidyalaya Admin</h1>
          <p className="text-sm text-ink/55 mt-1.5">Super admin console mein sign in karein</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-line rounded-2xl shadow-card p-6 space-y-4"
        >
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-ink/80">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="superadmin@vidyalaya.app"
              className={`${inputClass} mt-1.5`}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-semibold text-ink/80">Password</label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} pr-10`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-board hover:bg-board-light text-paper font-semibold text-sm rounded-lg py-3 transition-colors"
          >
            Sign in
            <ArrowRight size={16} />
          </button>
        </form>

        <button
          onClick={fillDemo}
          className="w-full text-center text-xs text-ink/50 hover:text-ink/80 mt-4 font-medium underline decoration-dotted underline-offset-4"
        >
          Demo credentials bhare (superadmin@vidyalaya.app)
        </button>
      </div>
    </div>
  )
}
