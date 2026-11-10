import api from './api'

export function normalizeProduct(p) {
  if (!p) return null
  return {
    ...p,
    id: p.slug || String(p.id),
    numericId: p.id,
    image: p.image_url || p.image,
    originalPrice: p.original_price !== undefined ? p.original_price : p.originalPrice,
    reviews: p.reviews_count !== undefined ? p.reviews_count : p.reviews,
    category: p.category?.slug || p.category,
    shortDescription: p.short_description || p.shortDescription,
    inStock: p.in_stock !== undefined ? Boolean(p.in_stock) : (p.inStock !== undefined ? Boolean(p.inStock) : true),
    stockQuantity: p.stock_quantity !== undefined ? p.stock_quantity : (p.stockQuantity !== undefined ? p.stockQuantity : 15),
  }
}

export const productService = {
  async getCategories() {
    const { data } = await api.get('/categories')
    return data
  },

  async getProducts(params = {}) {
    const { data } = await api.get('/products', { params })
    return {
      ...data,
      items: (data.items || []).map(normalizeProduct),
    }
  },

  async getProductBySlug(slug) {
    const { data } = await api.get(`/products/${slug}`)
    return normalizeProduct(data)
  },
}
