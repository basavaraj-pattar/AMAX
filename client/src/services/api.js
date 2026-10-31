export const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('a-max-token')
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${apiUrl}${path}`, { ...options, headers })
  let data
  try { data = await response.json() }
  catch { data = {} }
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status}).`)
    error.status = response.status
    throw error
  }
  return data
}

export async function apiUpload(path, file) {
  const token = localStorage.getItem('a-max-token')
  const headers = new Headers({
    'Content-Type': file.type || 'application/octet-stream',
    'X-File-Name': encodeURIComponent(file.name)
  })
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${apiUrl}${path}`, { method: 'POST', headers, body: file })
  let data
  try { data = await response.json() } catch { data = {} }
  if (!response.ok) {
    const error = new Error(data.message || `Upload failed (${response.status}).`)
    error.status = response.status
    throw error
  }
  return data
}

export async function apiDownload(path) {
  const token = localStorage.getItem('a-max-token')
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${apiUrl}${path}`, { headers })
  if (!response.ok) {
    let data = {}
    try { data = await response.json() } catch {}
    const error = new Error(data.message || `File unavailable (${response.status}).`)
    error.status = response.status
    throw error
  }
  return response.blob()
}
