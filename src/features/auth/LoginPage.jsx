import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import { validateLoginForm } from './auth.validation.js'
import { getErrorCode, getErrorMessage } from '../../api/httpClient.js'
import { inputClass, Field } from '../../components/ui.jsx'
import { PANEL_ROLES, ROLE_LABELS, ROLES } from './roles.js'

import titleLogo from '../../../src/assets/images/baner_title.png'
// 👇 attached classroom image ko is path par save karo (ya apna path/name daal do)
import brandLogo from '../../../src/assets/images/logo_title_transparent.png'
import classroomImg from '../../../src/assets/images/login-classroom.jpg'

const LAST_ROLE_KEY = 'panel_last_role'

// Left panel ki story: ek school din ke 3 moments
const STORY = [
  {
    time: '8:05 am',
    title: 'Attendance is marked before the first bell.',
    text: 'Parents know their child reached school safely, without a single phone call.',
  },
  {
    time: '11:30 am',
    title: 'A timetable change reaches every teacher.',
    text: 'Nobody waits in an empty classroom, and no one is left guessing.',
  },
  {
    time: '4:15 pm',
    title: 'Fees and results are ready when parents ask.',
    text: 'The front office stays calm, even in exam week.',
  },
]

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
      setServerError(getErrorCode(err) === 'INVALID_CREDENTIALS' ? 'Invalid email/username/mobile or password.' : getErrorMessage(err, 'Could not sign in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* ───────────── LEFT: storytelling panel (desktop only) ───────────── */}
      <aside className="relative hidden lg:flex flex-col justify-end overflow-hidden bg-board text-on-board">
        <img
          src={classroomImg}
          alt="Students studying together in a bright classroom"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* readable text ke liye dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-board via-board/85 to-board/30" />

        {/* Transparent logo, top-left. The PNG has wide empty margins, so it's cropped to the artwork. */}
        <div className="absolute z-10 top-10 left-12 xl:left-16 overflow-hidden" style={{ width: '16rem', height: '4.7rem' }}>
          <img
            src={brandLogo}
            alt="Nought One"
            className="max-w-none absolute"
            style={{ width: '20.25rem', left: '-2.43rem', top: '-4.32rem' }}
          />
        </div>

        <div className="relative z-10 p-12 xl:p-16 max-w-2xl">
          <h2 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.1] tracking-tight">
            Every classroom has a story. Keep yours in order.
          </h2>

          <ol className="mt-10 space-y-6 border-l border-on-board/25 pl-6">
            {STORY.map((item) => (
              <li key={item.time} className="relative">
                <span className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-on-board" />
                <p className="text-xs font-semibold text-on-board/60">{item.time}</p>
                <p className="mt-1 text-base font-semibold">{item.title}</p>
                <p className="mt-0.5 text-sm text-on-board/70 max-w-md">{item.text}</p>
              </li>
            ))}
          </ol>

          <p className="mt-10 text-sm text-on-board/60 max-w-md">
            Built for school admins and teachers who would rather spend the day with students
            than with spreadsheets.
          </p>
        </div>
      </aside>

      {/* ───────────── RIGHT: login form ───────────── */}
      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-2xl font-bold text-ink">Welcome Back!</h1>
            <p className="text-sm text-ink/55 mt-1.5">
              Sign in to the {ROLE_LABELS[role].toLowerCase()} console
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-surface border border-line rounded-2xl shadow-card p-6 space-y-4"
          >
            <div
              role="radiogroup"
              aria-label="Sign in as"
              className="grid grid-cols-2 gap-1 p-1 bg-paper border border-line rounded-xl"
            >
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

            <Field label="Email, username or mobile number" required error={errors.identifier}>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email, username or mobile"
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
      </main>
    </div>
  )
}