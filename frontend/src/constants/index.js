export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ASSISTANT: '/assistant',
  EXPLORE: '/explore',
  PRODUCT: '/product',
  COMPARE: '/compare',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  PROFILE: '/profile',
}

export const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'laptops', label: 'Laptops' },
  { id: 'smartphones', label: 'Smartphones' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'tablets', label: 'Tablets' },
  { id: 'cameras', label: 'Cameras' },
  { id: 'smartwatches', label: 'Smartwatches' },
  { id: 'speakers', label: 'Speakers' },
  { id: 'accessories', label: 'Accessories' },
]

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
]

export const MAX_COMPARE_ITEMS = 4
export const CURRENCY = '₹'
export const APP_NAME = 'PayNex'
export const APP_TAGLINE = 'Find Better. Buy Smarter.'
