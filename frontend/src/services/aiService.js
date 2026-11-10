import api from './api'

export const aiService = {
  async chat({ message, conversationId, budget }) {
    const { data } = await api.post('/ai/chat', {
      message,
      conversation_id: conversationId || null,
      budget: budget ? parseFloat(budget) : null,
    })
    return data
  },

  async getConversations() {
    const { data } = await api.get('/ai/conversations')
    return data
  },
}

export const dashboardService = {
  async getStats() {
    const { data } = await api.get('/dashboard/stats')
    return data
  },

  async getProfile() {
    const { data } = await api.get('/profile')
    return data
  },

  async updateProfile(profileData) {
    const { data } = await api.put('/profile', profileData)
    return data
  },
}
