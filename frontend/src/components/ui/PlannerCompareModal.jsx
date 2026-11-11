import { useState, useEffect } from 'react'
import { X, Sparkles, Check, Award, Zap, Loader2 } from 'lucide-react'
import { plannerService } from '../../services/plannerService'
import Button from './Button'

export default function PlannerCompareModal({
  isOpen,
  onClose,
  itemsToCompare = [],
  onSelectProduct,
}) {
  const [loading, setLoading] = useState(false)
  const [comparisonData, setComparisonData] = useState(null)

  useEffect(() => {
    if (!isOpen || !itemsToCompare || itemsToCompare.length < 2) return

    async function fetchCompare() {
      setLoading(true)
      try {
        const slugs = itemsToCompare.map(i => i.slug)
        const res = await plannerService.compareProducts(slugs)
        setComparisonData(res)
      } catch (err) {
        console.error('Failed to compare products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCompare()
  }, [isOpen, itemsToCompare])

  if (!isOpen || !itemsToCompare || itemsToCompare.length < 2) return null

  const products = comparisonData?.products || itemsToCompare
  const allSpecKeys = Array.from(
    new Set(products.flatMap(p => Object.keys(p.specs || {})))
  )

  const bestValSlug = comparisonData?.best_value_slug
  const bestPerfSlug = comparisonData?.best_performance_slug

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Product Comparison & Spec Matrix</h3>
              <p className="text-xs text-slate-500">Side-by-side technical evaluation with AI verdict</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* AI Verdict Banner */}
        {comparisonData?.ai_verdict && (
          <div className="px-6 py-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-start gap-3">
            <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">AI Evaluation Verdict</p>
              <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                {comparisonData.ai_verdict}
              </p>
            </div>
          </div>
        )}

        {/* Comparative Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <p className="text-xs font-medium">Generating comparison analysis...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-3 w-40 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 rounded-tl-xl">
                      Spec
                    </th>
                    {products.map((p) => {
                      const isBestVal = p.slug === bestValSlug
                      const isBestPerf = p.slug === bestPerfSlug

                      return (
                        <th key={p.slug} className="py-3 px-3 text-left min-w-[220px]">
                          <div className="space-y-2">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-24 h-24 object-cover rounded-xl border border-slate-200 mx-auto bg-slate-50"
                            />
                            <div>
                              <div className="flex items-center gap-1.5 justify-center mb-1">
                                {isBestVal && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                                    <Award size={10} /> Best Value
                                  </span>
                                )}
                                {isBestPerf && !isBestVal && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 flex items-center gap-0.5">
                                    <Zap size={10} /> Top Specs
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</p>
                              <p className="text-sm font-extrabold text-blue-600 mt-0.5">
                                ₹{p.price.toLocaleString('en-IN')}
                              </p>
                              <p className="text-[11px] text-amber-500 font-semibold">{p.rating}★ rating</p>
                            </div>
                            {onSelectProduct && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  onSelectProduct(p)
                                  onClose()
                                }}
                                className="w-full text-xs h-8"
                              >
                                <Check size={12} /> Choose This
                              </Button>
                            )}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* Brand Row */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/30">Brand</td>
                    {products.map(p => (
                      <td key={p.slug} className="py-2.5 px-3 font-medium text-slate-800">
                        {p.brand}
                      </td>
                    ))}
                  </tr>

                  {/* Rating & Reviews */}
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/30">Customer Rating</td>
                    {products.map(p => (
                      <td key={p.slug} className="py-2.5 px-3 text-slate-800">
                        {p.rating} / 5.0
                      </td>
                    ))}
                  </tr>

                  {/* Specs */}
                  {allSpecKeys.map(specKey => (
                    <tr key={specKey}>
                      <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/30 capitalize">
                        {specKey}
                      </td>
                      {products.map(p => (
                        <td key={p.slug} className="py-2.5 px-3 text-slate-700">
                          {p.specs?.[specKey] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
