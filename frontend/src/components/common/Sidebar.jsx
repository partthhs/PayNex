import { Link, useLocation } from 'react-router-dom'
import { X, Zap, LayoutDashboard, MessageSquare, ShoppingBag, GitCompare, ShoppingCart, Package, User, LogOut } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useCompare } from '../../context/CompareContext'

const NAV = [
  { label: 'Dashboard',       to: '/dashboard', Icon: LayoutDashboard },
  { label: 'AI Assistant',    to: '/assistant',  Icon: MessageSquare   },
  { label: 'Explore Products',to: '/explore',    Icon: ShoppingBag     },
  { label: 'Compare',         to: '/compare',    Icon: GitCompare      },
  { label: 'Cart',            to: '/cart',       Icon: ShoppingCart    },
  { label: 'Orders',          to: '/orders',     Icon: Package         },
  { label: 'Profile',         to: '/profile',    Icon: User            },
]

function SidebarContent({ onClose, pathname, cartCount, compareCount }) {
  const isActive = (to) => pathname === to || pathname.startsWith(to + '/')

  return (
    <div className="flex flex-col h-full bg-[#172554]">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-base font-bold text-white">PayNex</span>
        </Link>
        {/* Close button (mobile only) */}
        <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.map(({ label, to, Icon }) => {
          const active = isActive(to)
          const badge = to === '/cart' ? cartCount : to === '/compare' ? compareCount : 0

          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={[
                'h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 shrink-0">
        <div className="mb-3 px-3 py-2 rounded-lg bg-white/5 text-center">
          <p className="text-xs text-slate-400">Phase 2 Demo</p>
          <p className="text-xs text-slate-500">UI/UX Preview</p>
        </div>
        <button className="h-10 flex items-center gap-3 px-3 w-full rounded-lg text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const { pathname } = useLocation()
  const { cartCount }    = useCart()
  const { compareItems } = useCompare()

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 z-40">
        <SidebarContent
          onClose={onClose}
          pathname={pathname}
          cartCount={cartCount}
          compareCount={compareItems.length}
        />
      </aside>

      {/* Mobile: overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="relative w-64 h-full flex flex-col z-10">
            <SidebarContent
              onClose={onClose}
              pathname={pathname}
              cartCount={cartCount}
              compareCount={compareItems.length}
            />
          </aside>
        </div>
      )}
    </>
  )
}
