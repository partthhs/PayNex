import api from './api'

export const priceAlertService = {
  async createAlert(productId, targetPrice) {
    const { data } = await api.post('/alerts', {
      product_id: productId,
      target_price: targetPrice,
    })
    return data
  },

  async getAlerts() {
    const { data } = await api.get('/alerts')
    return data
  },

  async updateAlert(alertId, targetPrice) {
    const { data } = await api.put(`/alerts/${alertId}`, {
      target_price: targetPrice,
    })
    return data
  },

  async deleteAlert(alertId) {
    const { data } = await api.delete(`/alerts/${alertId}`)
    return data
  },
}
