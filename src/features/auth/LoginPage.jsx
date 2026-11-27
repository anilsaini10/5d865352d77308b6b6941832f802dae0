import { useEffect, useRef, useState, useCallback } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Loader2, Search, Mail, Lock } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import { authApi } from './auth.api.js'
import { validateLoginForm, EMAIL_PATTERN } from './auth.validation.js'
import { getErrorCode, getErrorMessage } from '../../api/httpClient.js'
import { inputClass, selectClass, Field } from '../../components/ui.jsx'
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js'
import { ROLES } from './roles.js'

import brandLogo from '../../../src/assets/images/logo_title_transparent.png'
import classroomImg from '../../../src/assets/images/login-classroom.jpg'

const LAST_LOGIN_TYPE_KEY = 'panel_last_login_type'
const LAST_SCHOOL_KEY = 'panel_last_school'
const VALID_LOGIN_TYPES = ['ADMIN', 'SUPER_ADMIN', 'OTHER']

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

function readLastLoginType() {
  try {
    const saved = localStorage.getItem(LAST_LOGIN_TYPE_KEY)
    return VALID_LOGIN_TYPES.includes(saved) ? saved : ''
  } catch {
    return ''
  }
}

function readLastSchool() {
  try {
    const raw = localStorage.getItem(LAST_SCHOOL_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function SchoolSearch({ value, onChange, error }) {
  const [query, setQuery] = useState(value?.name || '')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setSearching(true)
    authApi.searchSchools(debouncedQuery || undefined)
      .then((data) => {
        if (!cancelled) setResults(data?.items ?? data ?? [])
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setSearching(false)
      })
    return () => { cancelled = true }
  }, [debouncedQuery, open])

  useEffect(() => {
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const select = (school) => {
    onChange(school)
    setQuery(school.name)
    setOpen(false)
  }

  return (
    <Field label="School" required error={error}>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            type="text"
            value={value ? (query || value.name) : query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (value) onChange(null)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search for your school"
            className={`${inputClass} pl-10`}
            autoComplete="off"
          />
          {searching && <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/35 animate-spin" />}
        </div>
        {open && results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-paper border border-line rounded-lg shadow-pop max-h-48 overflow-y-auto">
            {results.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => select(s)}
                  className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-line/40 transition-colors"
                >
                  <span className="font-semibold text-ink">{s.name}</span>
                  {s.city && <span className="text-ink/50">, {s.city}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && !searching && results.length === 0 && debouncedQuery && (
          <div className="absolute z-10 mt-1 w-full bg-paper border border-line rounded-lg shadow-pop px-3.5 py-3 text-sm text-ink/50">
            No schools found
          </div>
        )}
      </div>
    </Field>
  )
}

function RoleSelect({ schoolId, value, onChange, error }) {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    if (!schoolId) { setRoles([]); setFetchError(''); return }
    let cancelled = false
    setLoading(true)
    setFetchError('')
    authApi.getSchoolRoles(schoolId)
      .then((data) => {
        if (!cancelled) setRoles(data?.roles ?? [])
      })
      .catch((err) => {
        if (!cancelled) {
          const code = getErrorCode(err)
          setFetchError(code === 'SCHOOL_NOT_FOUND' ? 'School not found.' : 'Could not load roles.')
          setRoles([])
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [schoolId])

  const noRoles = !loading && !fetchError && roles.length === 0 && !!schoolId
  const displayError = error || fetchError || (noRoles ? 'No staff logins are set up for this school yet. Contact your school admin.' : undefined)

  return (
    <Field label="Role" required error={displayError}>
      <div className="relative">
        <select
          value={value?.id || ''}
          onChange={(e) => {
            const found = roles.find((r) => r?.id === e?.target?.value)
            onChange(found || null)
          }}
          disabled={loading || noRoles || !!fetchError}
          className={selectClass}
        >
          <option value="" disabled>{loading ? 'Loading roles...' : 'Select role'}</option>
          {roles.map((r) => (
            <option key={r?.id} value={r?.id}>{r?.name}</option>
          ))}
        </select>
        {loading && <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/35 animate-spin pointer-events-none" />}
      </div>
    </Field>
  )
}

function useResendTimer() {
  const [countdown, setCountdown] = useState(0)
  const intervalRef = useRef(null)

  const start = useCallback((seconds) => {
    setCountdown(seconds)
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  return { countdown, start }
}

function OtpInput({ value, onChange, disabled }) {
  const inputRefs = useRef([])
  const raw = value.slice(0, 6)
  const digits = Array.from({ length: 6 }, (_, i) => raw[i] || '')

  const setDigit = (index, char) => {
    const next = [...digits]
    next[index] = char
    onChange(next.join(''))
  }

  const handleChange = (index, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    setDigit(index, char)
    if (char && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    const focusIdx = Math.min(pasted.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className="w-11 h-12 rounded-lg border border-line bg-surface text-center text-lg font-bold text-ink focus:border-board focus:ring-2 focus:ring-board/15 outline-none transition-shadow"
        />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const { login, loginWithResponse, user, ready } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [loginType, setLoginType] = useState(readLastLoginType)
  const [authMethod, setAuthMethod] = useState('password')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [school, setSchool] = useState(() => readLastLoginType() === 'OTHER' ? readLastSchool() : null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const { countdown: resendCountdown, start: startResendTimer } = useResendTimer()

  const isOther = loginType === 'OTHER'

  if (ready && user) {
    return <Navigate to={location.state?.from || '/'} replace />
  }

  const infoMessage = location.state?.message

  const subtitleMap = {
    ADMIN: 'Sign in to the admin console',
    SUPER_ADMIN: 'Sign in to the super admin console',
    OTHER: 'Sign in as school staff',
  }
  const subtitle = loginType ? subtitleMap[loginType] : 'Sign in to continue'

  const canSubmitPassword = !!loginType && !!identifier.trim() && !!password &&
    (!isOther || (!!school && !!selectedRole))

  const canSendOtp = !!loginType && !!identifier.trim() && EMAIL_PATTERN.test(identifier.trim()) &&
    (!isOther || (!!school && !!selectedRole))

  const canVerifyOtp = otpSent && otpValue.length === 6

  const handleLoginTypeChange = (e) => {
    setLoginType(e.target.value)
    setSchool(null)
    setSelectedRole(null)
    setServerError('')
    setErrors({})
    setOtpSent(false)
    setOtpValue('')
  }

  const handleSchoolChange = (s) => {
    setSchool(s)
    setSelectedRole(null)
    setErrors((prev) => ({ ...prev, school: undefined, role: undefined }))
  }

  const handleAuthMethodChange = (method) => {
    setAuthMethod(method)
    setServerError('')
    setErrors({})
    setOtpSent(false)
    setOtpValue('')
  }

  const getApiParams = () => {
    const apiRole = isOther ? ROLES.STAFF : loginType
    const schoolId = isOther ? school.id : undefined
    const customRoleId = isOther ? selectedRole.id : undefined
    return { apiRole, schoolId, customRoleId }
  }

  const saveLoginPreferences = () => {
    try {
      localStorage.setItem(LAST_LOGIN_TYPE_KEY, loginType)
      if (isOther && school) {
        localStorage.setItem(LAST_SCHOOL_KEY, JSON.stringify({ id: school.id, name: school.name }))
      }
    } catch {
      // storage unavailable
    }
  }

  const handleSendOtp = async () => {
    setServerError('')
    const email = identifier.trim()
    if (!EMAIL_PATTERN.test(email)) {
      setErrors({ identifier: 'Enter a valid email address to receive the OTP.' })
      return
    }
    if (!loginType) { setErrors({ loginType: 'Select a login type.' }); return }
    if (isOther && !school) { setErrors({ school: 'Select your school.' }); return }
    if (isOther && !selectedRole) { setErrors({ role: 'Select your role.' }); return }

    const { apiRole, schoolId, customRoleId } = getApiParams()
    setOtpSending(true)
    try {
      const data = await authApi.sendEmailOtp({ email, role: apiRole, schoolId, customRoleId })
      setOtpSent(true)
      setOtpValue('')
      startResendTimer(data.resendAfterSeconds || 60)
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'EMAIL_NOT_REGISTERED') {
        setServerError('This email is not registered. Check the login type and school you selected.')
      } else if (code === 'ACCOUNT_INACTIVE') {
        setServerError(getErrorMessage(err, 'Your account is inactive. Contact your admin.'))
      } else if (code === 'OTP_RESEND_COOLDOWN') {
        const retryAfter = err.response?.data?.error?.details?.retryAfterSeconds
        if (retryAfter) startResendTimer(retryAfter)
        setServerError(getErrorMessage(err, 'Please wait before requesting another OTP.'))
      } else if (code === 'OTP_LIMIT_REACHED') {
        setServerError(getErrorMessage(err, 'Too many OTP requests. Please try again later.'))
      } else if (code === 'OTP_SEND_FAILED') {
        setServerError('Could not send OTP right now. Please try again.')
      } else {
        setServerError(getErrorMessage(err, 'Could not send OTP. Please try again.'))
      }
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setServerError('')
    if (otpValue.length !== 6) return

    const email = identifier.trim()
    const { apiRole, schoolId, customRoleId } = getApiParams()
    setSubmitting(true)
    try {
      const data = await authApi.verifyEmailOtp({ email, otp: otpValue, role: apiRole, schoolId, customRoleId })
      loginWithResponse(data)
      saveLoginPreferences()
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'INVALID_OTP') {
        const attemptsLeft = err.response?.data?.error?.details?.attemptsLeft
        setServerError(
          attemptsLeft != null
            ? `Incorrect OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left.`
            : 'Incorrect OTP. Please try again.'
        )
      } else if (code === 'OTP_EXPIRED') {
        setServerError('OTP has expired. Please request a new one.')
        setOtpSent(false)
        setOtpValue('')
      } else if (code === 'OTP_ATTEMPTS_EXCEEDED') {
        setServerError('Too many incorrect attempts. Please request a new OTP.')
        setOtpSent(false)
        setOtpValue('')
      } else {
        setServerError(getErrorMessage(err, 'Could not verify OTP. Please try again.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateLoginForm({ identifier, password })
    if (!loginType) validationErrors.loginType = 'Select a login type.'
    if (isOther && !school) validationErrors.school = 'Select your school.'
    if (isOther && !selectedRole) validationErrors.role = 'Select your role.'
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const { apiRole, schoolId, customRoleId } = getApiParams()

    setSubmitting(true)
    try {
      await login(identifier.trim(), password, apiRole, schoolId, customRoleId)
      saveLoginPreferences()
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'INVALID_CREDENTIALS') {
        setServerError('Invalid credentials. Check the login type, school and role you selected.')
      } else if (code === 'ROLE_INACTIVE') {
        setServerError(getErrorMessage(err, 'Your role has been disabled. Please contact your school admin.'))
      } else if (code === 'SCHOOL_ID_REQUIRED') {
        setServerError('Please select your school.')
      } else if (code === 'VALIDATION_ERROR') {
        setServerError(getErrorMessage(err, 'Invalid request. Please check your inputs.'))
      } else {
        setServerError(getErrorMessage(err, 'Could not sign in. Please try again.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e) => {
    if (authMethod === 'otp') {
      if (otpSent) return handleVerifyOtp(e)
      e.preventDefault()
      handleSendOtp()
    } else {
      handlePasswordSubmit(e)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden lg:flex flex-col justify-end overflow-hidden bg-board text-on-board">
        <img
          src={classroomImg}
          alt="Students studying together in a bright classroom"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-board via-board/85 to-board/30" />

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

      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-2xl font-bold text-ink">Welcome Back!</h1>
            <p className="text-sm text-ink/55 mt-1.5">{subtitle}</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-surface border border-line rounded-2xl shadow-card p-6 space-y-4"
          >
            <Field label="Login as" required error={errors.loginType}>
              <select value={loginType} onChange={handleLoginTypeChange} className={selectClass}>
                <option value="" disabled>Select login type</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>

            {infoMessage && (
              <p className="text-sm text-board font-medium bg-board/8 border border-board/20 rounded-lg px-3 py-2">
                {infoMessage}
              </p>
            )}

            {isOther && (
              <>
                <SchoolSearch value={school} onChange={handleSchoolChange} error={errors.school} />
                {school && (
                  <RoleSelect
                    schoolId={school.id}
                    value={selectedRole}
                    onChange={setSelectedRole}
                    error={errors.role}
                  />
                )}
              </>
            )}

            <Field label="Email" required error={errors.identifier}>
              <input
                type="email"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setOtpSent(false); setOtpValue('') }}
                placeholder="Enter your email"
                className={inputClass}
                autoComplete="username"
              />
            </Field>

            <div className="flex gap-1 p-1 bg-line/30 rounded-xl">
              <button
                type="button"
                onClick={() => handleAuthMethodChange('password')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  authMethod === 'password'
                    ? 'bg-board text-on-board shadow-sm'
                    : 'text-ink/60 hover:text-ink hover:bg-line/40'
                }`}
              >
                <Lock size={14} />
                Password
              </button>
              <button
                type="button"
                onClick={() => handleAuthMethodChange('otp')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  authMethod === 'otp'
                    ? 'bg-board text-on-board shadow-sm'
                    : 'text-ink/60 hover:text-ink hover:bg-line/40'
                }`}
              >
                <Mail size={14} />
                Email OTP
              </button>
            </div>

            {authMethod === 'password' && (
              <>
                <Field label="Password" required error={errors.password}>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
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
              </>
            )}

            {authMethod === 'otp' && !otpSent && (
              <p className="text-xs text-ink/50 text-center">
                We'll send a 6-digit verification code to your email.
              </p>
            )}

            {authMethod === 'otp' && otpSent && (
              <div className="space-y-3">
                <p className="text-sm text-ink/70 text-center">
                  Enter the 6-digit code sent to <span className="font-semibold text-ink">{identifier.trim()}</span>
                </p>
                <OtpInput value={otpValue} onChange={setOtpValue} disabled={submitting} />
                <div className="text-center">
                  {resendCountdown > 0 ? (
                    <p className="text-xs text-ink/45">
                      Resend in <span className="font-semibold tabular-nums">{resendCountdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending}
                      className="text-xs font-semibold text-board hover:text-board-light underline decoration-dotted underline-offset-4 disabled:opacity-50"
                    >
                      {otpSending ? 'Sending...' : 'Resend OTP'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {serverError && (
              <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-3 py-2">
                {serverError}
              </p>
            )}

            {authMethod === 'password' && (
              <button
                type="submit"
                disabled={!canSubmitPassword || submitting}
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
            )}

            {authMethod === 'otp' && !otpSent && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={!canSendOtp || otpSending}
                className="w-full flex items-center justify-center gap-2 bg-board hover:bg-board-light disabled:opacity-60 text-paper font-semibold text-sm rounded-lg py-3 transition-colors"
              >
                {otpSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}

            {authMethod === 'otp' && otpSent && (
              <button
                type="submit"
                disabled={!canVerifyOtp || submitting}
                className="w-full flex items-center justify-center gap-2 bg-board hover:bg-board-light disabled:opacity-60 text-paper font-semibold text-sm rounded-lg py-3 transition-colors"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Verify & Sign in
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </form>

          <p className="text-center text-sm text-ink/50 mt-5">
            New school?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="font-semibold text-board hover:text-board-light underline decoration-dotted underline-offset-4"
            >
              Create an account
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
