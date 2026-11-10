import api from './api'

export const notificationService = {
  async getUnreadCount() {
    const { data } = await api.get('/notifications/unread-count')
    return data
  },

  async getNotifications(limit = 20) {
    const { data } = await api.get('/notifications', { params: { limit } })
    return data
  },

  async markAsRead(notifId) {
    const { data } = await api.put(`/notifications/${notifId}/read`)
    return data
  },

  async markAllAsRead() {
    const { data } = await api.put('/notifications/mark-all-read')
    return data
  },
}
