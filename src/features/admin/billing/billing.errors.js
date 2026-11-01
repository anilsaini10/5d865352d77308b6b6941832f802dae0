import { getErrorCode, getErrorMessage } from '../../../api/httpClient.js'

const UNAVAILABLE = 'Payments are temporarily unavailable, try again later.'

const ERROR_MESSAGES = {
  INVALID_PAYMENT_SIGNATURE: 'Payment could not be verified.',
  SUBSCRIPTION_NOT_PENDING: 'This subscription is no longer awaiting payment.',
  AMOUNT_TOO_LOW: "This plan can't be paid online.",
  PLAN_NOT_AVAILABLE: 'This plan is no longer available.',
  ALREADY_COVERED_BY_SCHOOL: 'Your school already covers this plan.',
  PAYMENT_GATEWAY_NOT_CONFIGURED: UNAVAILABLE,
  PAYMENT_GATEWAY_ERROR: UNAVAILABLE,
  PAYMENT_GATEWAY_AUTH_FAILED: UNAVAILABLE,
  FORBIDDEN: 'Your account is not linked to a school.',
}

/** Codes after which the plan list / entitlements on screen are stale. */
export const STALE_CODES = ['SUBSCRIPTION_NOT_PENDING', 'PLAN_NOT_AVAILABLE', 'ALREADY_COVERED_BY_SCHOOL']

export const isStaleError = (err) => STALE_CODES.includes(getErrorCode(err))

export function friendlyBillingError(err, fallback = 'Something went wrong. Please try again.') {
  return ERROR_MESSAGES[getErrorCode(err)] || getErrorMessage(err, fallback)
}
