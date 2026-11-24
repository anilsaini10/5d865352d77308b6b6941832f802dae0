import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Loader2, School, CheckCircle2 } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import { validateSignupForm } from './auth.validation.js'
import { getErrorCode, getErrorMessage } from '../../api/httpClient.js'
import { inputClass, Field } from '../../components/ui.jsx'

import brandLogo from '../../assets/images/logo_title_transparent.png'
import classroomImg from '../../assets/images/login-classroom.jpg'

const STEPS = [
  { key: 'school', title: 'School details', desc: 'Tell us about your school' },
  { key: 'admin', title: 'Admin account', desc: 'Create your admin login' },
  { key: 'password', title: 'Set password', desc: 'Secure your account' },
]

export default function SignupPage() {
  const { signup, user, ready } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (ready && user) {
    return <Navigate to="/" replace />
  }

  const validateStep = () => {
    const all = validateSignupForm({ name, email, phone, password, confirmPassword, schoolName })
    let stepErrors = {}
    if (step === 0) {
      if (all.schoolName) stepErrors.schoolName = all.schoolName
    } else if (step === 1) {
      if (all.name) stepErrors.name = all.name
      if (all.email) stepErrors.email = all.email
      if (all.phone) stepErrors.phone = all.phone
    } else {
      if (all.password) stepErrors.password = all.password
      if (all.confirmPassword) stepErrors.confirmPassword = all.confirmPassword
    }
    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep()) return
    setServerError('')
    setStep((s) => s + 1)
  }

  const handleBack = () => {
    setServerError('')
    setErrors({})
    setStep((s) => s - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep()) return
    setServerError('')
    setSubmitting(true)
    try {
      await signup({ name: name.trim(), email: email.trim(), phone: phone.trim(), password, schoolName: schoolName.trim() })
      navigate('/', { replace: true })
    } catch (err) {
      const code = getErrorCode(err)
      if (code === 'EMAIL_TAKEN') {
        setServerError('This email is already registered. Try logging in instead.')
      } else if (code === 'VALIDATION_ERROR') {
        setServerError(getErrorMessage(err, 'Please check your inputs and try again.'))
      } else {
        setServerError(getErrorMessage(err, 'Could not create account. Please try again.'))
      }
    } finally {
      setSubmitting(false)
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
            Take your school online in under 2 minutes.
          </h2>

          <ul className="mt-10 space-y-5">
            {[
              'Instant setup — no paperwork, no waiting',
              'Attendance, exams, fees, timetable — all in one place',
              'Parents get a mobile app from day one',
              'Free to start, upgrade when you need',
            ].map((text) => (
              <li key={text} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-chalk mt-0.5 shrink-0" />
                <span className="text-base text-on-board/85">{text}</span>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm text-on-board/60 max-w-md">
            Join hundreds of schools already using our platform to save time and stay connected.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-board/8 flex items-center justify-center mb-4">
              <School size={24} className="text-board" />
            </div>
            <h1 className="text-2xl font-bold text-ink">Create your school</h1>
            <p className="text-sm text-ink/55 mt-1.5">{STEPS[step].desc}</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-full h-1.5 rounded-full transition-colors ${i <= step ? 'bg-board' : 'bg-line'}`} />
                <span className={`text-[11px] font-semibold transition-colors ${i <= step ? 'text-board' : 'text-ink/35'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>

          <form
            onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext() }}
            className="bg-surface border border-line rounded-2xl shadow-card p-6 space-y-4"
          >
            {step === 0 && (
              <Field label="School name" required error={errors.schoolName}>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Delhi Public School"
                  className={inputClass}
                  autoFocus
                  autoComplete="organization"
                />
              </Field>
            )}

            {step === 1 && (
              <>
                <Field label="Your name" required error={errors.name}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Admin full name"
                    className={inputClass}
                    autoFocus
                    autoComplete="name"
                  />
                </Field>

                <Field label="Email address" required error={errors.email}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@school.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                </Field>

                <Field label="Mobile number" required error={errors.phone}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className={inputClass}
                    autoComplete="tel"
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Password" required error={errors.password}>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className={`${inputClass} pr-10`}
                      autoFocus
                      autoComplete="new-password"
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

                <Field label="Confirm password" required error={errors.confirmPassword}>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`${inputClass} pr-10`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </Field>
              </>
            )}

            {serverError && (
              <p className="text-sm text-coral font-medium bg-coral/8 border border-coral/20 rounded-lg px-3 py-2">
                {serverError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 flex items-center justify-center gap-2 border border-line hover:bg-line/40 text-ink/70 font-semibold text-sm rounded-lg py-3 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-board hover:bg-board-light disabled:opacity-60 text-paper font-semibold text-sm rounded-lg py-3 transition-colors"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : step === 2 ? (
                  <>
                    Create School
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-ink/50 mt-5">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-semibold text-board hover:text-board-light underline decoration-dotted underline-offset-4"
            >
              Sign in
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
