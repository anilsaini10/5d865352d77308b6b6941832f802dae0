import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ROLES } from '../../auth/roles.js'
import { registerPaymentRequiredHandler } from '../../../api/httpClient.js'
import { billingApi } from './billing.api.js'

const EntitlementsContext = createContext(null)

export function EntitlementsProvider({ children }) {
  const { user } = useAuth()
  const isAdmin = user?.role === ROLES.ADMIN
  const [entitlements, setEntitlements] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lockedFeature, setLockedFeature] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await billingApi.entitlements()
      setEntitlements(data)
    } catch {
      // silent — entitlements are best-effort
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) fetch()
  }, [isAdmin, fetch])

  useEffect(() => {
    if (!isAdmin) return
    registerPaymentRequiredHandler((details) => {
      setLockedFeature(details ?? null)
    })
    return () => registerPaymentRequiredHandler(null)
  }, [isAdmin])

  const reload = useCallback(() => {
    if (isAdmin) fetch()
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

  const dismissLocked = useCallback(() => setLockedFeature(null), [])

  return (
    <EntitlementsContext.Provider value={{ entitlements, loading, reload, hasFeature, getFeature, expiringSchoolSubscription, lockedFeature, dismissLocked }}>
      {children}
    </EntitlementsContext.Provider>
  )
}

export function useEntitlements() {
  const ctx = useContext(EntitlementsContext)
  if (!ctx) throw new Error('useEntitlements must be used within EntitlementsProvider')
  return ctx
}
