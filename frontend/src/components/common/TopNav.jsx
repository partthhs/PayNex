import { Link, useLocation } from 'react-router-dom'
import { Menu, ShoppingCart, Bell, Search } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/assistant': 'AI Shopping Assistant',
  '/explore':   'Explore Products',
  '/compare':   'Compare Products',
  '/cart':      'Shopping Cart',
  '/checkout':  'Checkout',
  '/orders':    'My Orders',
  '/profile':   'My Profile',
}

export default function TopNav({ onMenuToggle }) {
  const { pathname } = useLocation()
  const { cartCount } = useCart()
  const { user } = useAuth()

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'PayNex'
  const initial = (user?.full_name || 'U').charAt(0).toUpperCase()

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center px-4 sm:px-6 gap-4">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      <span className="font-bold text-slate-900 text-sm sm:text-base flex-1 truncate">{title}</span>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Search (decorative) */}
        <button
          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Notification (decorative) */}
        <button
          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* Cart */}
        <Link
          to="/cart"
          className="relative w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Shopping cart"
        >
          <ShoppingCart size={18} />
          {cartCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link
          to="/profile"
          className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center ml-1 hover:ring-2 hover:ring-blue-300 transition shrink-0 cursor-pointer"
          aria-label="Profile"
        >
          <span className="text-white text-xs font-bold">{initial}</span>
        </Link>
      </div>
    </header>
  )
}
