import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

let unauthorizedHandler = null

/** AuthProvider registers what to do when the server rejects the session. */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler
}

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register']

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    if (status === 401 && !AUTH_ENDPOINTS.some((p) => url.startsWith(p))) {
      unauthorizedHandler?.(error.response?.data?.error)
    }
    return Promise.reject(error)
  },
)

/** Human-readable message from an API error. */
export function errorMessage(error, fallback = 'Something went wrong. Try again.') {
  if (!error) return fallback
  if (error.response?.data?.error) return error.response.data.error
  if (error.code === 'ERR_NETWORK') return "Can't reach the server. Check your connection."
  return fallback
}

export default apiClient
