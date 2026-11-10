import { useState } from 'react'
import { X, Bell, TrendingDown, Check } from 'lucide-react'
import { priceAlertService } from '../../services/priceAlertService'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import Button from './Button'

export default function PriceTrackModal({ product, isOpen, onClose, onAlertCreated }) {
  const { user } = useAuth()
  const [targetPrice, setTargetPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen || !product) return null

  const currentPrice = product.price || 0
  const numericTarget = parseFloat(targetPrice) || 0
  const savings = currentPrice - numericTarget
  const savingsPct = currentPrice > 0 ? ((savings / currentPrice) * 100).toFixed(0) : 0

  const setDiscountTarget = (percent) => {
    const discounted = Math.round(currentPrice * (1 - percent / 100))
    setTargetPrice(discounted.toString())
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      setError('Please sign in to set price alerts.')
      return
    }
    if (!numericTarget || numericTarget <= 0) {
      setError('Please enter a valid target price.')
      return
    }
    if (numericTarget >= currentPrice) {
      setError(`Target price must be lower than the current price (₹${currentPrice.toLocaleString('en-IN')}).`)
      return
    }

    setLoading(true)
    setError('')
    try {
      const prodId = product.numericId || product.id
      await priceAlertService.createAlert(prodId, numericTarget)
      setSuccess(true)
      onAlertCreated?.()
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1800)
    } catch (err) {
      let detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        detail = detail.map(d => d.msg || JSON.stringify(d)).join(', ')
      } else if (typeof detail !== 'string') {
        detail = err.message || 'Failed to create price alert. Please try again.'
      }
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Track Price Drop</h3>
              <p className="text-xs text-slate-500">Get notified when this item reaches your target</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Mini Banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60 mb-5">
            <img
              src={product.image || product.image_url}
              alt={product.name}
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x300/EFF6FF/1D4ED8?text=Product' }}
              className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{product.brand}</p>
              <h4 className="text-xs font-semibold text-slate-900 truncate">{product.name}</h4>
              <p className="text-sm font-bold text-blue-600 mt-0.5">
                Current: ₹{(Number(currentPrice) || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {!user ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 mb-3">Sign in to start tracking prices and receiving drop alerts.</p>
              <Link to="/login" className="inline-block">
                <Button size="sm">Sign In to Track</Button>
              </Link>
            </div>
          ) : success ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Check size={24} />
              </div>
              <h4 className="font-semibold text-slate-900 text-base">Alert Set Successfully!</h4>
              <p className="text-xs text-slate-500 mt-1">
                We'll notify you as soon as the price reaches ₹{numericTarget.toLocaleString('en-IN')}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Set Your Target Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => {
                      setTargetPrice(e.target.value)
                      setError('')
                    }}
                    placeholder={`e.g. ${Math.round(currentPrice * 0.9)}`}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick discount buttons */}
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Quick suggestions:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountTarget(pct)}
                      className="py-1.5 px-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-600 transition"
                    >
                      {pct}% Off (₹{Math.round(currentPrice * (1 - pct / 100)).toLocaleString('en-IN')})
                    </button>
                  ))}
                </div>
              </div>

              {/* Projected savings box */}
              {numericTarget > 0 && numericTarget < currentPrice && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs">
                  <TrendingDown size={16} className="shrink-0" />
                  <span>
                    You will save <strong>₹{savings.toLocaleString('en-IN')}</strong> ({savingsPct}%) when price drops!
                  </span>
                </div>
              )}

              {error && (
                <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200/60">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? 'Setting Alert...' : 'Set Price Alert'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
