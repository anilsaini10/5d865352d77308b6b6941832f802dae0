import { httpClient } from '../../api/httpClient.js'
import { cleanParams } from '../../utils/format.js'

const BASE = '/super-admin/subscription'
const data = (res) => res.data.data

export const featuresApi = {
  list(filters = {}) {
    return httpClient.get(`${BASE}/features`, { params: cleanParams(filters) }).then(data)
  },
  create(payload) {
    return httpClient.post(`${BASE}/features`, payload).then(data)
  },
  update(featureId, payload) {
    return httpClient.patch(`${BASE}/features/${featureId}`, payload).then(data)
  },
  remove(featureId) {
    return httpClient.delete(`${BASE}/features/${featureId}`).then(data)
  },
}

export const plansApi = {
  list(filters = {}) {
    return httpClient.get(`${BASE}/plans`, { params: cleanParams(filters) }).then(data)
  },
  get(planId) {
    return httpClient.get(`${BASE}/plans/${planId}`).then(data)
  },
  create(payload) {
    return httpClient.post(`${BASE}/plans`, payload).then(data)
  },
  update(planId, payload) {
    return httpClient.patch(`${BASE}/plans/${planId}`, payload).then(data)
  },
  remove(planId) {
    return httpClient.delete(`${BASE}/plans/${planId}`).then(data)
  },
  /** Replaces the plan's whole feature list. @param {{featureId:string, role?:string}[]} features */
  setFeatures(planId, features) {
    return httpClient.put(`${BASE}/plans/${planId}/features`, { features }).then(data)
  },
  addFeatures(planId, features) {
    return httpClient.post(`${BASE}/plans/${planId}/features`, { features }).then(data)
  },
  removeFeature(planId, planFeatureId) {
    return httpClient.delete(`${BASE}/plans/${planId}/features/${planFeatureId}`).then(data)
  },
  addPrice(planId, payload) {
    return httpClient.post(`${BASE}/plans/${planId}/prices`, payload).then(data)
  },
  updatePrice(planId, priceId, payload) {
    return httpClient.patch(`${BASE}/plans/${planId}/prices/${priceId}`, payload).then(data)
  },
  removePrice(planId, priceId) {
    return httpClient.delete(`${BASE}/plans/${planId}/prices/${priceId}`).then(data)
  },
}

export const subscriptionsApi = {
  /** @returns {Promise<{items, page, pageSize, total, totalPages, statusCounts}>} */
  list(filters = {}) {
    return httpClient.get(`${BASE}/subscriptions`, { params: cleanParams(filters) }).then(data)
  },
  get(subscriptionId) {
    return httpClient.get(`${BASE}/subscriptions/${subscriptionId}`).then(data)
  },
  activate(subscriptionId, { reference, note } = {}) {
    return httpClient.post(`${BASE}/subscriptions/${subscriptionId}/activate`, cleanParams({ reference: reference?.trim(), note: note?.trim() })).then(data)
  },
  cancel(subscriptionId, { note } = {}) {
    return httpClient.post(`${BASE}/subscriptions/${subscriptionId}/cancel`, cleanParams({ note: note?.trim() })).then(data)
  },
}
