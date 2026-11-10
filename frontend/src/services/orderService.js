import api from './api'

export const orderService = {
  async createOrder(shippingData) {
    const { data } = await api.post('/orders', { shipping: shippingData })
    return data
  },

  async getOrders() {
    const { data } = await api.get('/orders')
    return data
  },

  async getOrder(orderId) {
    const { data } = await api.get(`/orders/${orderId}`)
    return data
  },
}

export const paymentService = {
  async createPaypalOrder(orderId) {
    const { data } = await api.post('/payments/create', { order_id: orderId })
    return data
  },

  async capturePayment(paypalOrderId) {
    const { data } = await api.post('/payments/capture', { paypal_order_id: paypalOrderId })
    return data
  },
}
