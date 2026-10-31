import { createContext, useContext, useEffect, useState } from 'react'
import { adminRequest, clearAdminToken, getAdminToken, setAdminToken } from '../services/adminApi'

const AdminSessionContext = createContext(null)

export function AdminSessionProvider({ children }) {
  const [session, setSession] = useState(() => {
    const token = getAdminToken()
    return { token, admin: null, loading: Boolean(token), error: '' }
  })

  useEffect(() => {
    let active = true
    if (!session.token) {
      setSession(s => s.admin || s.loading || s.error ? { token: null, admin: null, loading: false, error: '' } : s)
      return () => { active = false }
    }
    adminRequest('/auth/me')
      .then(admin => { if (active) setSession({ token: session.token, admin, loading: false, error: '' }) })
      .catch(() => { if (active) { clearAdminToken(); setSession({ token: null, admin: null, loading: false, error: '' }) } })
    return () => { active = false }
  }, [session.token])

  const acceptAdminSession = data => {
    setAdminToken(data.token)
    setSession({ token: data.token, admin: data.admin, loading: false, error: '' })
  }

  const clearAdminSession = () => {
    clearAdminToken()
    setSession({ token: null, admin: null, loading: false, error: '' })
  }

  const updateToken = token => {
    setAdminToken(token)
    setSession(s => ({ ...s, token }))
  }

  return (
    <AdminSessionContext.Provider value={{ ...session, acceptAdminSession, clearAdminSession, updateToken }}>
      {children}
    </AdminSessionContext.Provider>
  )
}

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext)
  if (!ctx) throw new Error('useAdminSession must be used inside AdminSessionProvider')
  return ctx
}
