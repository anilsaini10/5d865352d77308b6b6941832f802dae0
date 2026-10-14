import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import { validateLoginForm } from './auth.validation.js'
import { getErrorMessage } from '../../api/httpClient.js'
import { inputClass, Field } from '../../components/ui.jsx'
import { PANEL_ROLES, ROLE_LABELS, ROLES } from './roles.js'

import titleLogo from "../../../src/assets/images/baner_title.png";

const LAST_ROLE_KEY = 'panel_last_role'

function readLastRole() {
  try {
    const saved = localStorage.getItem(LAST_ROLE_KEY)
    return PANEL_ROLES.includes(saved) ? saved : ROLES.ADMIN
  } catch {
    return ROLES.ADMIN
  }
}

export default function LoginPage() {
  const { login, user, ready } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [role, setRole] = useState(readLastRole)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (ready && user) {
    return <Navigate to={location.state?.from || '/'} replace />
  }

  const infoMessage = location.state?.message

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateLoginForm({ identifier, password })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      await login(identifier.trim(), password, role)
      try {
        localStorage.setItem(LAST_ROLE_KEY, role)
      } catch {
        // storage unavailable — the role just won't be remembered
      }
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setServerError(getErrorMessage(err, 'Invalid credentials.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-board flex items-center justify-center mb-4 shadow-card">
            <GraduationCap size={24} className="text-chalk" strokeWidth={2.3} />
          </div>
          <img src={titleLogo} alt="logo" className="w-54 h-auto mb-2" />
          <h1 className="font-display text-2xl font-semibold text-ink">Nought One</h1>
          {/* <h1 className="font-display text-2xl font-semibold text-ink">School Admin Pannel</h1> */}
          <p className="text-sm text-ink/55 mt-1.5">Sign in to the {ROLE_LABELS[role].toLowerCase()} console</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-line rounded-2xl shadow-card p-6 space-y-4"
        >
          <div role="radiogroup" aria-label="Sign in as" className="grid grid-cols-2 gap-1 p-1 bg-paper border border-line rounded-xl">
            {PANEL_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={role === r}
                onClick={() => setRole(r)}
                className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                  role === r ? 'bg-board text-on-board shadow-card' : 'text-ink/60 hover:text-ink'
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          {infoMessage && (
            <p className="text-sm text-board font-medium bg-board/8 border border-board/20 rounded-lg px-3 py-2">
              {infoMessage}
            </p>
          )}

          <Field label="Email or phone" required error={errors.identifier}>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
              autoComplete="username"
              autoFocus
            />
          </Field>

          <Field label="Password" required error={errors.password}>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
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
          </Field>

          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs font-semibold text-board hover:text-board-light underline decoration-dotted underline-offset-4"
            >
              Forgot password?
            </button>
          </div>

          {serverError && (
            <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-board hover:bg-board-light disabled:opacity-60 text-paper font-semibold text-sm rounded-lg py-3 transition-colors"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
