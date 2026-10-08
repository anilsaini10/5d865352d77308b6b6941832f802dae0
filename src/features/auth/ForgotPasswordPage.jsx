import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { authApi } from './auth.api.js'
import { validateForgotPasswordForm, validateResetConfirmForm } from './auth.validation.js'
import { getErrorCode, getErrorMessage } from '../../api/httpClient.js'
import { Field, inputClass } from '../../components/ui.jsx'

const NEUTRAL_MESSAGE = 'If an account with that email exists, an OTP has been sent to it.'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState('email') // 'email' | 'reset'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  const submitEmail = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateForgotPasswordForm({ email })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      await authApi.forgotPassword(email.trim())
      setInfo(NEUTRAL_MESSAGE)
      setStep('reset')
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not send the code. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const resendCode = async () => {
    setServerError('')
    setResending(true)
    try {
      await authApi.forgotPassword(email.trim())
      setInfo('A new code has been sent, if that account exists.')
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not resend the code.'))
    } finally {
      setResending(false)
    }
  }

  const submitReset = async (e) => {
    e.preventDefault()
    setServerError('')

    const validationErrors = validateResetConfirmForm({ otp, newPassword, confirmPassword })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      await authApi.confirmResetPassword({ email: email.trim(), otp: otp.trim(), newPassword })
      navigate('/login', { replace: true, state: { message: 'Password reset successfully. Please log in again.' } })
    } catch (err) {
      if (getErrorCode(err) === 'INVALID_OTP') {
        setErrors({ otp: 'That code is invalid or has expired.' })
      } else {
        setServerError(getErrorMessage(err, 'Could not reset your password.'))
      }
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
          <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
          <p className="text-sm text-ink/55 mt-1.5">
            {step === 'email' ? "We'll email you a one-time code" : 'Enter the code and choose a new password'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={submitEmail} className="bg-surface border border-line rounded-2xl shadow-card p-6 space-y-4">
            <Field label="Email" required error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                autoComplete="email"
                autoFocus
              />
            </Field>

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
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <>Send code <ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={submitReset} className="bg-surface border border-line rounded-2xl shadow-card p-6 space-y-4">
            {info && (
              <p className="text-sm text-board font-medium bg-board/8 border border-board/20 rounded-lg px-3 py-2">
                {info}
              </p>
            )}

            <Field label="6-digit code" required error={errors.otp}>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                className={`${inputClass} font-mono tracking-widest`}
                autoFocus
              />
            </Field>

            <Field label="New password" required error={errors.newPassword} hint="6-100 characters">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </Field>

            <Field label="Confirm new password" required error={errors.confirmPassword}>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </Field>

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
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <>Reset password <ArrowRight size={16} /></>}
            </button>

            <button
              type="button"
              onClick={resendCode}
              disabled={resending}
              className="w-full text-center text-xs text-ink/50 hover:text-ink/80 font-medium underline decoration-dotted underline-offset-4 disabled:opacity-50"
            >
              {resending ? 'Resending…' : 'Resend code'}
            </button>
          </form>
        )}

        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center justify-center gap-1.5 text-sm text-ink/55 hover:text-ink/80 mt-5 font-medium"
        >
          <ArrowLeft size={14} /> Back to login
        </button>
      </div>
    </div>
  )
}
