import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ROLES } from '../../auth/roles.js'
import { getErrorMessage, registerPaymentRequiredHandler } from '../../../api/httpClient.js'
import { billingApi } from './billing.api.js'

const EntitlementsContext = createContext(null)

const LIVE_STATUSES = ['ACTIVE', 'EXPIRING_SOON']
/** Does this plan currently give the admin access (own subscription, running trial, or covered by the school)? */
const grantsAccess = (p) => LIVE_STATUSES.includes(p.mySubscription?.status) || !!p.onTrial || p.action === 'NONE' || !!p.coveredBySchool

/** Milliseconds until the next moment any plan's access can flip (a period ends or starts, a trial ends). */
function msToNextBoundary(plans, now = Date.now()) {
  let next = Infinity
  for (const p of plans) {
    const sub = p.mySubscription
    const times = [p.trial?.startsAt, p.trial?.endsAt]
    if (sub) times.push(sub.status === 'UPCOMING' ? sub.startDate : sub.endDate)
    for (const t of times) {
      const ms = t ? new Date(t).getTime() : NaN
      if (ms > now && ms < next) next = ms
    }
  }
  return next === Infinity ? null : next - now
}

export function EntitlementsProvider({ children }) {
  const { user } = useAuth()
  const isAdmin = user?.role === ROLES.ADMIN
  const [entitlements, setEntitlements] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lockedFeature, setLockedFeature] = useState(null)
  const [plans, setPlans] = useState(null) // null = not loaded yet
  const [plansError, setPlansError] = useState('')

  // Entitlements and plans are refreshed together; both are best-effort (a failure never locks anyone out).
  const fetch = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      billingApi.entitlements().then(setEntitlements).catch(() => {}),
      billingApi.plans().then((p) => { setPlans(p); setPlansError('') }).catch((err) => setPlansError(getErrorMessage(err, 'Could not load plans.'))),
    ])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isAdmin) fetch()
  }, [isAdmin, fetch])

  useEffect(() => {
    if (!isAdmin) return
    registerPaymentRequiredHandler((details) => {
      setLockedFeature(details ?? {})
      fetch() // the locally cached entitlements were stale
    })
    return () => registerPaymentRequiredHandler(null)
  }, [isAdmin, fetch])

  const reload = useCallback(() => {
    if (isAdmin) fetch()
  }, [isAdmin, fetch])

  // Refresh when the admin comes back to the tab (e.g. after paying elsewhere); at most once every 30s.
  const lastFetchRef = useRef(0)
  useEffect(() => {
    if (!isAdmin) return undefined
    const onFocus = () => {
      if (document.visibilityState === 'hidden' || Date.now() - lastFetchRef.current < 30000) return
      lastFetchRef.current = Date.now()
      fetch()
    }
    lastFetchRef.current = Date.now()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [isAdmin, fetch])

  const hasFeature = useCallback(
    (key) => {
      if (!entitlements?.features) return true
      const f = entitlements.features.find((feat) => feat.key === key)
      if (!f) return true
      return f.hasAccess
    },
    [entitlements],
  )

  const getFeature = useCallback(
    (key) => {
      if (!entitlements?.features) return null
      return entitlements.features.find((feat) => feat.key === key) ?? null
    },
    [entitlements],
  )

  const expiringSchoolSubscription = entitlements?.subscriptions?.find(
    (s) => s.subscriberType === 'SCHOOL' && s.status === 'EXPIRING_SOON',
  )

  const trials = entitlements?.trials ?? []

  // Paywall: plans exist for this admin, but none of them currently grants access. No plans (or plans failed to load) → nothing is locked.
  const paywalled = isAdmin && !!plans?.length && !plans.some(grantsAccess)

  // Re-check exactly when a subscription or trial starts/ends, so access flips without a reload.
  useEffect(() => {
    if (!isAdmin || !plans) return undefined
    const ms = msToNextBoundary(plans)
    if (ms == null || ms > 2 ** 31 - 2000) return undefined
    const id = setTimeout(fetch, ms + 1500)
    return () => clearTimeout(id)
  }, [isAdmin, plans, fetch])

  const dismissLocked = useCallback(() => setLockedFeature(null), [])

  return (
    <EntitlementsContext.Provider value={{ entitlements, loading, reload, hasFeature, getFeature, expiringSchoolSubscription, trials, plans, plansError, paywalled, lockedFeature, dismissLocked }}>
      {children}
    </EntitlementsContext.Provider>
  )
}

export function useEntitlements() {
  const ctx = useContext(EntitlementsContext)
  if (!ctx) throw new Error('useEntitlements must be used within EntitlementsProvider')
  return ctx
}

/** Active free trials; empty outside the provider. */
export function useTrials() {
  return useContext(EntitlementsContext)?.trials ?? []
}

/**
 * Access state for one feature key. Safe outside the provider / before entitlements load / for unknown keys:
 * those all read as unlocked, so a missing key never blocks a page.
 */
export function useFeature(key) {
  const ctx = useContext(EntitlementsContext)
  const f = ctx?.getFeature(key) ?? null
  if (!f) return { feature: null, name: null, hasAccess: true, status: null, daysLeft: null, reason: null, availableIn: [] }
  return {
    feature: f,
    name: f.name,
    hasAccess: f.hasAccess !== false,
    status: f.status ?? null,
    daysLeft: f.daysLeft ?? null,
    reason: f.reason ?? null,
    availableIn: f.availableIn ?? [],
  }
}
