import { getErrorCode, getErrorMessage } from '../../api/httpClient.js'

const usageList = (usages = []) => usages.map((u) => `${u.planCode}${u.role ? ` (${u.role})` : ''}`).join(', ')

/** Error codes that mean "this is in use — deactivate it instead". */
export const IN_USE_CODES = ['FEATURE_IN_USE', 'PLAN_IN_USE', 'PLAN_PRICE_IN_USE']

/** One user-facing message for any subscription-module error, with the specific hint for known 409 codes. */
export function describeError(err, fallback) {
  const code = getErrorCode(err)
  const base = getErrorMessage(err, fallback)
  const d = err?.response?.data?.error?.details
  switch (code) {
    case 'FEATURE_KEY_EXISTS': return 'A feature with this key already exists. Choose a different key.'
    case 'FEATURE_ROLE_IN_USE': return `${base}${d?.usages?.length ? ` Used by: ${usageList(d.usages)}.` : ''}`
    case 'FEATURE_IN_USE': return 'This feature is used in one or more plans, so it cannot be deleted. Deactivate it instead.'
    case 'FEATURE_NOT_FOUND': return 'One of the selected features no longer exists. Reload and try again.'
    case 'FEATURE_ROLE_MISMATCH': return `${base}${d?.featureKey ? ` (feature "${d.featureKey}" does not support role ${d.role}).` : ''}`
    case 'PLAN_CODE_EXISTS': return 'A plan with this code already exists. Choose a different code.'
    case 'PLAN_IN_USE': return base
    case 'PLAN_PRICE_IN_USE': return 'This price has already been bought. Deactivate it instead.'
    case 'DUPLICATE_PRICE': return 'This plan already has a price for that duration. Edit it, or pick a different duration.'
    case 'SCHOOL_NOT_FOUND': return 'The selected school no longer exists.'
    case 'SUBSCRIPTION_NOT_PENDING': return 'This subscription is no longer awaiting payment. The list has been refreshed.'
    case 'SUBSCRIPTION_ALREADY_CANCELLED': return 'This subscription is already cancelled. The list has been refreshed.'
    default: return base
  }
}
