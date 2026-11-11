import api from './api'

export const plannerService = {
  async generatePlan(payload) {
    const { data } = await api.post('/planner/generate', payload)
    return data
  },

  async savePlan(payload) {
    const { data } = await api.post('/planner/save', payload)
    return data
  },

  async getPlans() {
    const { data } = await api.get('/planner/plans')
    return data
  },

  async getPlan(planId) {
    const { data } = await api.get(`/planner/plans/${planId}`)
    return data
  },

  async deletePlan(planId) {
    const { data } = await api.delete(`/planner/plans/${planId}`)
    return data
  },

  async replaceItem(payload) {
    const { data } = await api.post('/planner/replace-item', payload)
    return data
  },

  async getAlternatives(category, currentSlug, maxPrice, currentPrice) {
    const { data } = await api.get('/planner/alternatives', {
      params: {
        category,
        current_slug: currentSlug,
        max_price: maxPrice,
        current_price: currentPrice,
      },
    })
    return data
  },

  async compareProducts(slugs, userRequirements = '') {
    const { data } = await api.post('/planner/compare-products', {
      slugs,
      user_requirements: userRequirements,
    })
    return data
  },

  async addAllToCart(planId) {
    const { data } = await api.post(`/planner/add-all-to-cart?plan_id=${planId}`)
    return data
  },
}
