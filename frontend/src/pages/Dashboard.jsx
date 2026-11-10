import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageSquare, ShoppingBag, GitCompare, ShoppingCart,
  Search, Heart, Eye, ArrowRight, Package
} from 'lucide-react'
import { PRODUCTS } from '../data/products'
import { DASHBOARD_STATS as FALLBACK_STATS, RECENT_ACTIVITY as FALLBACK_ACTIVITY, QUICK_ACTIONS } from '../data/sampleData'
import { useAuth } from '../context/AuthContext'
import { dashboardService } from '../services/aiService'
import StatCard from '../components/ui/StatCard'
import ProductCard from '../components/products/ProductCard'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'

const ACTION_ICONS = { MessageSquare, ShoppingBag, GitCompare, ShoppingCart }
const ACTIVITY_ICONS = { Search, Heart, Eye, GitCompare, MessageSquare, order: Package, cart: ShoppingCart, wishlist: Heart }

const ACTION_BG = {
  blue:    'bg-blue-50 text-blue-600',
  sky:     'bg-sky-50 text-sky-600',
  indigo:  'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState(FALLBACK_STATS)
  const [activity, setActivity] = useState(FALLBACK_ACTIVITY)

  useEffect(() => {
    async function loadStats() {
      if (isAuthenticated) {
        try {
          const data = await dashboardService.getStats()
          setStats([
            { id: 1, title: 'AI Sessions', value: String(data.ai_sessions || 0), iconName: 'MessageSquare', trend: 'up', change: 'Active conversations' },
            { id: 2, title: 'Saved Products', value: String(data.wishlist_count || 0), iconName: 'Heart', trend: 'up', change: 'In your wishlist' },
            { id: 3, title: 'Orders Placed', value: String(data.order_count || 0), iconName: 'ShoppingBag', trend: 'neutral', change: 'Verified purchases' },
            { id: 4, title: 'Cart Items', value: String(data.cart_count || 0), iconName: 'ShoppingCart', trend: 'up', change: 'Awaiting checkout' },
          ])

          if (data.recent_activity?.length > 0) {
            setActivity(data.recent_activity.map(a => ({
              id: a.id,
              type: a.action_type,
              text: a.description,
              time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              iconName: a.action_type,
            })))
          }
        } catch (err) {
          console.warn('Could not fetch real dashboard stats:', err)
        }
      }
    }
    loadStats()
  }, [isAuthenticated])

  const greeting = user?.full_name ? `Welcome back, ${user.full_name} 👋` : 'Good morning, Shopper 👋'

  return (
    <div>
      <PageHeader
        title={greeting}
        description="Here's your live shopping overview and real-time activity."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              iconName={stat.iconName}
              trend={stat.trend}
              change={stat.change}
            />
          </motion.div>
        ))}
      </div>

      {/* Main 2-col */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        {/* Recommended Products (2/3) */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recommended Products</h2>
              <p className="text-xs text-slate-500">Curated based on active criteria</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/explore')} className="text-xs">
              View All <ArrowRight size={13} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRODUCTS.slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Right column (1/3) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-5">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Quick Navigation</h2>
              <div className="space-y-1.5">
                {QUICK_ACTIONS.map(action => {
                  const Icon = ACTION_ICONS[action.iconName] || ShoppingBag
                  const bgCls = ACTION_BG[action.color] || ACTION_BG.blue
                  return (
                    <button
                      key={action.id}
                      onClick={() => navigate(action.route)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors text-left group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bgCls}`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{action.label}</p>
                        <p className="text-[11px] text-slate-500 truncate">{action.description}</p>
                      </div>
                      <ArrowRight size={13} className="text-slate-300 ml-auto shrink-0 group-hover:text-blue-500 transition-colors" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Recent Activity</h2>
              <div className="space-y-2.5">
                {activity.map(item => {
                  const Icon = ACTIVITY_ICONS[item.iconName] || ACTIVITY_ICONS[item.type] || Search
                  return (
                    <div key={item.id} className="flex items-start gap-2.5 py-1">
                      <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={12} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-700 leading-snug">{item.text}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-slate-400 text-center">
        Live PostgreSQL session and activity tracking connected.
      </p>
    </div>
  )
}
