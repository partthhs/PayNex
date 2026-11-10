import api from './api'

export const cartService = {
  async getCart() {
    const { data } = await api.get('/cart')
    return data
  },

  async addToCart(productId, quantity = 1) {
    const { data } = await api.post('/cart', { product_id: productId, quantity })
    return data
  },

  async updateQuantity(itemId, quantity) {
    const { data } = await api.put(`/cart/${itemId}`, { quantity })
    return data
  },

  async removeFromCart(itemId) {
    const { data } = await api.delete(`/cart/${itemId}`)
    return data
  },

  async clearCart() {
    const { data } = await api.delete('/cart')
    return data
  },
}
