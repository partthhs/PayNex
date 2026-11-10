import {
  MessageSquare, Heart, GitCompare, PiggyBank, Search, Eye,
  ShoppingBag, ShoppingCart, TrendingUp, TrendingDown, Minus,
  LayoutDashboard, Package, User, Bell, Star, Zap, ArrowRight,
  Check, X, Plus, Filter, Send, Shield, ShieldCheck, Settings,
  LogOut, Menu, ChevronDown, ChevronRight,
} from 'lucide-react'

const ICON_MAP = {
  MessageSquare, Heart, GitCompare, PiggyBank, Search, Eye,
  ShoppingBag, ShoppingCart, TrendingUp, TrendingDown, Minus,
  LayoutDashboard, Package, User, Bell, Star, Zap, ArrowRight,
  Check, X, Plus, Filter, Send, Shield, ShieldCheck, Settings,
  LogOut, Menu, ChevronDown, ChevronRight,
}

const trendConfig = {
  up:      { icon: TrendingUp,   color: 'text-green-600' },
  down:    { icon: TrendingDown, color: 'text-red-500'   },
  neutral: { icon: Minus,        color: 'text-slate-400' },
}

export default function StatCard({ title, value, iconName, trend = 'neutral', change }) {
  const Icon = ICON_MAP[iconName] || ShoppingBag
  const { icon: TrendIcon, color: trendColor } = trendConfig[trend] || trendConfig.neutral

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-colors h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <Icon size={20} className="text-blue-600" />
          </div>
          <TrendIcon size={16} className={`${trendColor} shrink-0`} />
        </div>
        <p className="text-2xl font-bold text-slate-900 mb-0.5 leading-tight">{value}</p>
        <p className="text-xs font-medium text-slate-500 mb-1 leading-snug">{title}</p>
      </div>
      {change && <p className={`text-[11px] font-semibold ${trendColor} mt-2`}>{change}</p>}
    </div>
  )
}
