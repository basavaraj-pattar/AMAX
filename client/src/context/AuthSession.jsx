import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { apiRequest, apiUrl } from '../services/api'

const AuthSessionContext = createContext(null)

export function AuthSessionProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [retryCount, setRetryCount] = useState(0)
  const [socket, setSocket] = useState(null)
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem('a-max-token')
    return { token, user: null, loading: Boolean(token), error: '' }
  })

  useEffect(() => {
    let active = true
    if (!session.token) {
      setSession(current => current.user || current.loading || current.error
        ? { token: null, user: null, loading: false, error: '' }
        : current)
      return () => { active = false }
    }

    const token = session.token
    setSession(current => current.token === token && current.user
      ? current
      : { token, user: null, loading: true, error: '' })
    apiRequest('/auth/me')
      .then(user => {
        if (active) {
          try {
            localStorage.setItem('a-max-profile', JSON.stringify({
              name: user.name,
              role: user.preferences?.primaryIdentity === 'filmmaker' ? 'Filmmaker' : 'Cinephile',
              image: user.avatarUrl || '/profile-avatar-placeholder.svg'
            }))
            window.dispatchEvent(new CustomEvent('a-max-profile-updated'))
          } catch {}
          setSession({ token, user, loading: false, error: '' })
        }
      })
      .catch(error => {
        if (!active) return
        if (/expired|invalid|authentication required|user not found/i.test(error.message)) {
          localStorage.removeItem('a-max-token')
          setSession({ token: null, user: null, loading: false, error: '' })
        } else {
          setSession({ token, user: null, loading: false, error: error.message })
        }
      })
    return () => { active = false }
  }, [session.token, retryCount])

  useEffect(() => {
    if (!session.token) {
      setSocket(null)
      return undefined
    }
    const client = io(new URL(apiUrl).origin, {
      auth: { token: session.token },
      reconnection: true,
      reconnectionAttempts: Infinity
    })
    setSocket(client)
    return () => {
      client.disconnect()
      setSocket(current => current === client ? null : current)
    }
  }, [session.token])

  useEffect(() => {
    if (session.loading || session.error || !session.user) return
    if (session.user.onboardingStatus === 'pending' && location.pathname !== '/onboarding' && !['/login', '/signup'].includes(location.pathname)) {
      navigate('/onboarding', { replace: true })
      return
    }
    if (session.user.onboardingStatus !== 'pending' && session.user.cinematicIntroSeen === false && location.pathname !== '/cinematic-intro' && !['/login', '/signup'].includes(location.pathname)) {
      navigate('/cinematic-intro', { replace: true })
    }
  }, [location.pathname, navigate, session])

  useEffect(() => {
    const syncToken = () => {
      const token = localStorage.getItem('a-max-token')
      setSession(current => current.token === token
        ? current
        : { token, user: null, loading: Boolean(token), error: '' })
    }
    window.addEventListener('storage', syncToken)
    return () => window.removeEventListener('storage', syncToken)
  }, [])

  const acceptSession = data => {
    localStorage.setItem('a-max-token', data.token)
    localStorage.setItem('a-max-profile', JSON.stringify({
      name: data.user.name,
      role: data.user.preferences?.primaryIdentity === 'filmmaker' ? 'Filmmaker' : 'Cinephile',
      image: data.user.avatarUrl || '/profile-avatar-placeholder.svg'
    }))
    setSession({ token: data.token, user: data.user, loading: false, error: '' })
  }
  const clearSession = () => {
    localStorage.removeItem('a-max-token')
    setSession({ token: null, user: null, loading: false, error: '' })
  }
  const setUser = useCallback(user => setSession(current => ({ ...current, user })), [])

  if (session.loading) return <div className="session-status" role="status">Restoring your AMAX session…</div>
  if (session.error) return <main className="session-status session-error" role="alert"><p>{session.error}</p><button className="primary-button" onClick={() => setRetryCount(value => value + 1)}>Try again</button><button className="text-button" onClick={() => { localStorage.removeItem('a-max-token'); setSession({ token: null, user: null, loading: false, error: '' }); navigate('/login') }}>Sign out</button></main>

  return <AuthSessionContext.Provider value={{
    ...session,
    socket,
    acceptSession,
    clearSession,
    setUser
  }}>{children}</AuthSessionContext.Provider>
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext)
  if (!context) throw new Error('useAuthSession must be used inside AuthSessionProvider.')
  return context
}

export function RequireAuth({ children }) {
  const { user } = useAuthSession()
  const location = useLocation()
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />
}
