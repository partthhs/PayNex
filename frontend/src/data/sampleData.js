export const DASHBOARD_STATS = [
  { id: 1, title: 'Shopping Sessions', value: '24', iconName: 'MessageSquare', trend: 'up', change: '+3 this week' },
  { id: 2, title: 'Saved Products', value: '47', iconName: 'Heart', trend: 'up', change: '+12 this week' },
  { id: 3, title: 'Comparisons Made', value: '18', iconName: 'GitCompare', trend: 'neutral', change: 'Same as last week' },
  { id: 4, title: 'Budget Saved', value: '₹12,450', iconName: 'PiggyBank', trend: 'up', change: 'vs original prices' },
]

export const RECENT_ACTIVITY = [
  { id: 1, type: 'search', text: 'Searched for "laptop under 70k for programming"', time: '2 hours ago', iconName: 'Search' },
  { id: 2, type: 'compare', text: 'Compared MacBook Air M3 vs Dell XPS 15', time: '3 hours ago', iconName: 'GitCompare' },
  { id: 3, type: 'save', text: 'Saved Sony WH-1000XM5 to wishlist', time: '1 day ago', iconName: 'Heart' },
  { id: 4, type: 'view', text: 'Viewed iPhone 15 Pro details', time: '1 day ago', iconName: 'Eye' },
  { id: 5, type: 'search', text: 'Searched for "wireless earphones under 5000"', time: '2 days ago', iconName: 'Search' },
]

export const QUICK_ACTIONS = [
  { id: 1, label: 'Start AI Chat', description: 'Describe what you need', iconName: 'MessageSquare', route: '/assistant', color: 'blue' },
  { id: 2, label: 'Explore Products', description: 'Browse all categories', iconName: 'ShoppingBag', route: '/explore', color: 'sky' },
  { id: 3, label: 'Compare Items', description: 'Side-by-side comparison', iconName: 'GitCompare', route: '/compare', color: 'indigo' },
  { id: 4, label: 'View Cart', description: 'Review selected products', iconName: 'ShoppingCart', route: '/cart', color: 'emerald' },
]

export const SUGGESTED_PROMPTS = [
  'Find a laptop under ₹70,000 for programming',
  'Suggest wireless headphones under ₹5,000',
  'Find a smartphone with a good camera under ₹30,000',
  'Compare laptops for college students',
  'Best budget smartwatch under ₹15,000',
  'Gaming mouse and keyboard combo under ₹5,000',
]

export const SAMPLE_ORDERS = []
