import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import apiClient, { onUnauthorized } from '../api/apiClient'
import { queryClient } from '../api/queries'

const AuthContext = createContext(null)

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(readUser)
  // True until the stored token has been checked against the server.
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem('token')))

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    queryClient.clear()
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    queryClient.clear()
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updated) => {
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
  }, [])

  useEffect(() => {
    onUnauthorized((message) => {
      if (!localStorage.getItem('token')) return
      logout()
      toast.error(message || 'Your session expired. Log in again.', { id: 'session-expired' })
    })
  }, [logout])

  useEffect(() => {
    if (!token) {
      setChecking(false)
      return
    }
    let cancelled = false
    apiClient.get('/api/auth/me')
      .then((r) => { if (!cancelled) updateUser(r.data.user) })
      .catch(() => {}) // 401s are handled by the interceptor; network errors keep the cached user.
      .finally(() => { if (!cancelled) setChecking(false) })
    return () => { cancelled = true }
  }, [token, updateUser])

  const value = useMemo(() => ({ token, user, checking, login, logout, updateUser }),
    [token, user, checking, login, logout, updateUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export function useCurrency() {
  return useContext(AuthContext)?.user?.currency || 'USD'
}
