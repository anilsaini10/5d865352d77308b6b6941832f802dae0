import { httpClient } from '../../../api/httpClient.js'
import { unwrap } from '../../../api/apiHelpers.js'
import { cleanParams } from '../../../utils/format.js'

const BASE = '/subscription'

export const billingApi = {
  plans() {
    return httpClient.get(`${BASE}/plans`).then(unwrap)
  },

  subscribe(planPriceId) {
    return httpClient.post(`${BASE}/subscribe`, { planPriceId }).then(unwrap)
  },

  dummyPay(subscriptionId) {
    return httpClient.post(`${BASE}/my-subscriptions/${subscriptionId}/dummy-pay`).then(unwrap)
  },

  mySubscriptions(filters = {}) {
    return httpClient.get(`${BASE}/my-subscriptions`, { params: cleanParams(filters) }).then(unwrap)
  },

  mySubscription(subscriptionId) {
    return httpClient.get(`${BASE}/my-subscriptions/${subscriptionId}`).then(unwrap)
  },

  cancelSubscription(subscriptionId) {
    return httpClient.post(`${BASE}/my-subscriptions/${subscriptionId}/cancel`).then(unwrap)
  },

  entitlements() {
    return httpClient.get(`${BASE}/entitlements`).then(unwrap)
  },
}
