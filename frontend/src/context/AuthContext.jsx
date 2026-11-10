import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      if (authService.isAuthenticated()) {
        try {
          const me = await authService.getMe()
          setUser(me)
          localStorage.setItem('paynex_user', JSON.stringify(me))
        } catch {
          authService.logout()
          setUser(null)
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const login = async (credentials) => {
    const data = await authService.login(credentials)
    setUser(data.user)
    return data
  }

  const register = async (credentials) => {
    const data = await authService.register(credentials)
    setUser(data.user)
    return data
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
