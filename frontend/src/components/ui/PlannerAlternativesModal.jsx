import { useState, useEffect } from 'react'
import { X, Sparkles, TrendingDown, ArrowUpRight, Check, SlidersHorizontal, Loader2 } from 'lucide-react'
import { plannerService } from '../../services/plannerService'
import Button from './Button'

export default function PlannerAlternativesModal({
  isOpen,
  onClose,
  currentItem,
  remainingBudget = 0,
  onSelectAlternative,
  onCompareWithItem,
}) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [filterTier, setFilterTier] = useState('all') // all | budget_saver | balanced | premium_upgrade

  useEffect(() => {
    if (!isOpen || !currentItem) return

    async function fetchAlts() {
      setLoading(true)
      try {
        const maxPrice = currentItem.price + remainingBudget
        const res = await plannerService.getAlternatives(
          currentItem.category,
          currentItem.slug,
          maxPrice,
          currentItem.price
        )
        setData(res)
      } catch (err) {
        console.error('Failed to fetch alternatives:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAlts()
  }, [isOpen, currentItem, remainingBudget])

  if (!isOpen || !currentItem) return null

  const alternatives = data?.alternatives || []
  const filtered = alternatives.filter(a => {
    if (filterTier === 'all') return true
    return a.tier === filterTier
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Alternative Recommendations</h3>
              <p className="text-xs text-slate-500">
                Category: <span className="font-medium capitalize text-slate-700">{currentItem.category}</span> • Max allowance: ₹{(currentItem.price + remainingBudget).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current product reference pill */}
        <div className="px-6 py-3 bg-blue-50/40 border-b border-blue-100/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={currentItem.image_url}
              alt={currentItem.name}
              className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Current in plan</span>
              <p className="text-xs font-semibold text-slate-900 truncate">{currentItem.name}</p>
            </div>
          </div>
          <span className="text-sm font-bold text-blue-700 shrink-0">
            ₹{currentItem.price.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto bg-white">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <SlidersHorizontal size={12} /> Filter:
          </span>
          {[
            { key: 'all', label: `All (${alternatives.length})` },
            { key: 'budget_saver', label: 'Budget Savers' },
            { key: 'balanced', label: 'Balanced' },
            { key: 'premium_upgrade', label: 'Premium Upgrades' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterTier(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterTier === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alternatives List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <p className="text-xs font-medium">Scanning catalog for budget-optimal alternatives...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs">No matching alternatives in this price tier within your available budget.</p>
            </div>
          ) : (
            filtered.map(({ product, price_difference, recommendation_reason, tier }) => {
              return (
                <div key={product.slug} className="pt-3 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 bg-slate-50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{product.brand}</span>
                        {tier === 'budget_saver' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                            <TrendingDown size={10} /> Save ₹{Math.abs(price_difference).toLocaleString('en-IN')}
                          </span>
                        )}
                        {tier === 'premium_upgrade' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-0.5">
                            <ArrowUpRight size={10} /> +₹{Math.abs(price_difference).toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-[10px] text-amber-500 font-semibold">{product.rating}★</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">{product.name}</h4>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                        {recommendation_reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0">
                    <div className="text-right sm:mr-2">
                      <span className="text-sm font-bold text-slate-900 block">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onCompareWithItem?.(currentItem, product)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 text-xs font-semibold transition"
                      title="Compare specs side-by-side"
                    >
                      Compare
                    </button>

                    <Button
                      size="sm"
                      onClick={() => {
                        onSelectAlternative?.(product)
                        onClose()
                      }}
                      className="text-xs"
                    >
                      <Check size={13} /> Select
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
