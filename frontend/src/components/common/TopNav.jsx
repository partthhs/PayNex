import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, ShoppingCart, Bell, Search, ExternalLink } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { notificationService } from '../../services/notificationService'

const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/assistant':    'AI Shopping Assistant',
  '/planner':      'AI Smart Planner',
  '/price-alerts': 'My Price Alerts',
  '/explore':      'Explore Products',
  '/compare':      'Compare Products',
  '/cart':         'Shopping Cart',
  '/checkout':     'Checkout',
  '/orders':       'My Orders',
  '/profile':      'My Profile',
}

export default function TopNav({ onMenuToggle }) {
  const { pathname } = useLocation()
  const { cartCount } = useCart()
  const { user } = useAuth()

  // Notification states
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'PayNex'
  const initial = (user?.full_name || 'U').charAt(0).toUpperCase()

  // Fetch unread notifications count
  const fetchUnread = async () => {
    if (!user) return
    try {
      const data = await notificationService.getUnreadCount()
      setUnreadCount(data.count || 0)
    } catch {
      // ignore
    }
  }

  // Fetch full notifications list when opening dropdown
  const loadNotifications = async () => {
    if (!user) return
    try {
      const data = await notificationService.getNotifications(6)
      setNotifications(data || [])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchUnread()
    const timer = setInterval(fetchUnread, 45000)
    return () => clearInterval(timer)
  }, [user])

  const toggleDropdown = () => {
    if (!dropdownOpen) {
      loadNotifications()
    }
    setDropdownOpen(prev => !prev)
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {
      // ignore
    }
  }

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n))
        )
      } catch {
        // ignore
      }
    }
    setDropdownOpen(false)
  }

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        {/* Search */}
        <Link
          to="/explore"
          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Search"
        >
          <Search size={18} />
        </Link>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="relative w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-2.5 ${
                        !n.is_read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        !n.is_read ? 'bg-blue-600' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                          <span>{n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          {n.link && (
                            <Link
                              to={n.link}
                              onClick={() => setDropdownOpen(false)}
                              className="text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              View Item <ExternalLink size={10} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 pt-2.5 border-t border-slate-100 text-center">
                <Link
                  to="/price-alerts"
                  onClick={() => setDropdownOpen(false)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Manage Price Alerts →
                </Link>
              </div>
            </div>
          )}
        </div>

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
