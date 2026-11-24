import axios from 'axios'
import { API_BASE_URL } from './httpClient.js'

const publicClient = axios.create({ baseURL: API_BASE_URL })

export const publicApi = {
  listSchools({ search, city, board, page = 1, limit = 20 } = {}) {
    return publicClient
      .get('/public/schools', { params: { search, city, board, page, limit } })
      .then((res) => res.data.data)
  },

  getSchool(schoolId) {
    return publicClient
      .get(`/public/schools/${schoolId}`)
      .then((res) => res.data.data)
  },

  getSchoolTeachers(schoolId, { page = 1, limit = 20 } = {}) {
    return publicClient
      .get(`/public/schools/${schoolId}/teachers`, { params: { page, limit } })
      .then((res) => res.data.data)
  },
}
