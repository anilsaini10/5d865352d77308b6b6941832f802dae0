import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gift, X } from 'lucide-react'
import { Button } from '../../../../components/ui.jsx'
import { todayInput } from '../../../../utils/format.js'
import { useTrials } from '../EntitlementsContext.jsx'
import { TRIAL_BANNER_KEY } from '../billing.constants.js'

const dismissedToday = () => {
  try { return localStorage.getItem(TRIAL_BANNER_KEY) === todayInput() } catch { return false }
}

/** Dismissible "your free trial ends in N days" banner; stays hidden for the rest of the day once closed. */
export default function TrialBanner() {
  const navigate = useNavigate()
  const trials = useTrials()
  const [dismissed, setDismissed] = useState(dismissedToday)

  const trial = [...trials].sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))[0]
  if (!trial || dismissed) return null

  const dismiss = () => {
    try { localStorage.setItem(TRIAL_BANNER_KEY, todayInput()) } catch { /* private mode: just hide for now */ }
    setDismissed(true)
  }
  const days = trial.daysLeft

  return (
    <div className="flex items-center gap-3 bg-info/10 border border-info/30 rounded-2xl px-5 py-3 mb-6" role="status">
      <Gift size={20} className="text-info shrink-0" />
      <p className="text-sm text-ink flex-1">
        Your free trial of <span className="font-semibold">{trial.plan?.name}</span> ends in {days} day{days === 1 ? '' : 's'}.
      </p>
      <Button size="sm" onClick={() => navigate(`/billing/plans${trial.plan?.id ? `?plan=${trial.plan.id}` : ''}`)}>Subscribe</Button>
      <button type="button" onClick={dismiss} className="text-ink/50 hover:text-ink p-1 rounded-full" aria-label="Dismiss"><X size={16} /></button>
    </div>
  )
}
