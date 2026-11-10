import api from './api'

export const authService = {
  async register({ full_name, email, password }) {
    const { data } = await api.post('/auth/register', { full_name, email, password })
    if (data.access_token) {
      localStorage.setItem('paynex_token', data.access_token)
      localStorage.setItem('paynex_user', JSON.stringify(data.user))
    }
    return data
  },

  async login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password })
    if (data.access_token) {
      localStorage.setItem('paynex_token', data.access_token)
      localStorage.setItem('paynex_user', JSON.stringify(data.user))
    }
    return data
  },

  async getMe() {
    const { data } = await api.get('/auth/me')
    return data
  },

  logout() {
    localStorage.removeItem('paynex_token')
    localStorage.removeItem('paynex_user')
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('paynex_user')
    try {
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('paynex_token'))
  },
}
