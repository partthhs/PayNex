import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, TrendingDown, CheckCircle, Clock, Trash2, Edit3, ExternalLink } from 'lucide-react'
import { priceAlertService } from '../services/priceAlertService'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import PriceTrackModal from '../components/ui/PriceTrackModal'

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN') : Number(n || 0).toLocaleString('en-IN'))

export default function PriceAlerts() {
  const { isAuthenticated } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // all | tracking | price_dropped | target_reached
  const [editProduct, setEditProduct] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const loadAlerts = async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await priceAlertService.getAlerts()
      setAlerts(data || [])
    } catch (err) {
      console.error('Failed to load price alerts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [isAuthenticated])

  const handleStopTracking = async (alertId) => {
    if (!window.confirm('Are you sure you want to stop tracking this price alert?')) return
    try {
      await priceAlertService.deleteAlert(alertId)
      setAlerts(prev => prev.filter(a => a.id !== alertId))
    } catch (err) {
      alert('Failed to delete alert')
    }
  }

  const handleEdit = (alert) => {
    setEditProduct({
      id: alert.product_id,
      numericId: alert.product_id,
      name: alert.name,
      brand: alert.brand,
      price: alert.current_price,
      image: alert.image_url,
    })
    setIsEditModalOpen(true)
  }

  const filteredAlerts = alerts.filter(a => {
    if (activeTab === 'all') return a.is_active
    return a.is_active && a.status === activeTab
  })

  const stats = {
    total: alerts.filter(a => a.is_active).length,
    reached: alerts.filter(a => a.is_active && a.status === 'target_reached').length,
    dropped: alerts.filter(a => a.is_active && a.status === 'price_dropped').length,
    tracking: alerts.filter(a => a.is_active && a.status === 'tracking').length,
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'target_reached':
        return <Badge variant="success">Target Reached!</Badge>
      case 'price_dropped':
        return <Badge variant="warning">Price Dropped</Badge>
      default:
        return <Badge variant="primary">Tracking</Badge>
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="My Price Alerts"
        description="Monitor product prices and get instant notifications when your target price is reached."
        actions={
          <Link to="/explore">
            <Button size="sm">Explore Products to Track</Button>
          </Link>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase">Active Alerts</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
          <p className="text-xs font-semibold text-emerald-700 uppercase">Target Reached</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.reached}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30">
          <p className="text-xs font-semibold text-amber-700 uppercase">Price Dropped</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.dropped}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30">
          <p className="text-xs font-semibold text-blue-700 uppercase">Still Tracking</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.tracking}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'all', label: `All Alerts (${stats.total})` },
          { key: 'target_reached', label: `Target Reached (${stats.reached})` },
          { key: 'price_dropped', label: `Price Dropped (${stats.dropped})` },
          { key: 'tracking', label: `Tracking (${stats.tracking})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <p>Loading price alerts...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          icon={<Bell size={28} />}
          title={isAuthenticated ? 'No price alerts found' : 'Sign in to track prices'}
          description={
            isAuthenticated
              ? (activeTab === 'all'
                  ? "You haven't set any price alerts yet. Browse products and click 'Track Price' on any item!"
                  : `No alerts with status "${activeTab.replace('_', ' ')}".`)
              : 'Log in with your PayNex account to track prices and receive real-time drop notifications.'
          }
          action={
            <Link to={isAuthenticated ? '/explore' : '/login'}>
              <Button size="sm">{isAuthenticated ? 'Browse Products' : 'Sign In'}</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.map(alert => {
            const hasSavings = alert.current_price <= alert.target_price
            return (
              <div
                key={alert.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={alert.image_url}
                        alt={alert.name}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-100 shrink-0 bg-slate-50"
                      />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{alert.brand}</p>
                        <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{alert.name}</h4>
                        <div className="mt-1">{getStatusBadge(alert.status)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl mb-4 text-center">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">Initial</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        ₹{fmt(alert.initial_price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">Current</p>
                      <p className={`text-sm font-bold mt-0.5 ${hasSavings ? 'text-emerald-600' : 'text-slate-900'}`}>
                        ₹{fmt(alert.current_price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">Target</p>
                      <p className="text-sm font-bold text-blue-600 mt-0.5">
                        ₹{fmt(alert.target_price)}
                      </p>
                    </div>
                  </div>

                  {/* Savings / Gap pill */}
                  {hasSavings ? (
                    <div className="flex items-center gap-1.5 p-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold mb-3">
                      <CheckCircle size={15} />
                      <span>Ready to buy! Price reached target of ₹{fmt(alert.target_price)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 p-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium mb-3">
                      <TrendingDown size={15} />
                      <span>₹{fmt(alert.current_price - alert.target_price)} ({alert.pct_diff || 0}%) drop needed to hit target</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock size={12} />
                    <span>Started {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(alert)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Target Price"
                    >
                      <Edit3 size={15} />
                    </button>
                    <Link
                      to={`/product/${alert.slug}`}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="View Product"
                    >
                      <ExternalLink size={15} />
                    </Link>
                    <button
                      onClick={() => handleStopTracking(alert.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Stop Tracking"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      {isEditModalOpen && editProduct && (
        <PriceTrackModal
          product={editProduct}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onAlertCreated={loadAlerts}
        />
      )}
    </div>
  )
}
