import { apiUrl } from './api'

const ADMIN_TOKEN_KEY = 'a-max-admin-token'

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

export async function adminRequest(path, options = {}) {
  const token = getAdminToken()
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${apiUrl}/admin${path}`, { ...options, headers })
  let data
  try { data = await response.json() } catch { data = {} }
  if (!response.ok) {
    const error = new Error(data.message || `Admin request failed (${response.status}).`)
    error.status = response.status
    throw error
  }
  return data
}
