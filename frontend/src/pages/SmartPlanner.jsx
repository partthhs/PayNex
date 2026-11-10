import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, BrainCircuit, Check, Trash2, RefreshCw, ShoppingCart,
  Bookmark, Eye, AlertCircle
} from 'lucide-react'
import { plannerService } from '../services/plannerService'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const AVAILABLE_CATEGORIES = [
  { slug: 'laptops', label: 'Laptops' },
  { slug: 'smartphones', label: 'Smartphones' },
  { slug: 'headphones', label: 'Headphones' },
  { slug: 'tablets', label: 'Tablets' },
  { slug: 'cameras', label: 'Cameras' },
  { slug: 'smartwatches', label: 'Smartwatches' },
  { slug: 'speakers', label: 'Speakers' },
  { slug: 'accessories', label: 'Accessories' },
]

export default function SmartPlanner() {
  const { user } = useAuth()
  const { refreshCart } = useCart()

  // Form states
  const [budget, setBudget] = useState('75000')
  const [requirements, setRequirements] = useState('I need a high-performance laptop for coding and a pair of noise-cancelling headphones.')
  const [selectedCategories, setSelectedCategories] = useState(['laptops', 'headphones'])
  const [preferredBrands, setPreferredBrands] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  // Plan result state
  const [currentPlan, setCurrentPlan] = useState(null)
  const [savedPlans, setSavedPlans] = useState([])
  const [planName, setPlanName] = useState('My Workspace Setup')

  // Loading & error states
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddingCart, setIsAddingCart] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Load user's saved plans
  const loadSavedPlans = async () => {
    if (!user) return
    try {
      const data = await plannerService.getPlans()
      setSavedPlans(data || [])
    } catch (err) {
      console.warn('Could not load saved plans:', err)
    }
  }

  useEffect(() => {
    loadSavedPlans()
  }, [user])

  const toggleCategory = (slug) => {
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  const handleGenerate = async (e) => {
    e?.preventDefault()
    if (!budget || Number(budget) <= 0) {
      setError('Please provide a valid budget ceiling.')
      return
    }
    if (!requirements.trim()) {
      setError('Please describe what products you are shopping for.')
      return
    }

    setIsGenerating(true)
    setError('')
    setSuccessMsg('')

    try {
      const brandsList = preferredBrands
        ? preferredBrands.split(',').map(b => b.trim()).filter(Boolean)
        : []

      const result = await plannerService.generatePlan({
        budget: Number(budget),
        requirements: requirements.trim(),
        categories: selectedCategories,
        preferred_brands: brandsList,
        additional_requirements: additionalNotes.trim(),
      })

      setCurrentPlan(result)
      setPlanName(`Plan: ₹${Number(budget).toLocaleString('en-IN')} Setup`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate shopping plan. Please adjust your budget or criteria.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRemoveItem = (indexToRemove) => {
    if (!currentPlan) return
    const updatedItems = currentPlan.items.filter((_, idx) => idx !== indexToRemove)
    const newTotal = updatedItems.reduce((sum, item) => sum + item.price, 0)
    const newRemaining = currentPlan.budget - newTotal
    const newUtil = currentPlan.budget > 0 ? (newTotal / currentPlan.budget) * 100 : 0

    setCurrentPlan({
      ...currentPlan,
      items: updatedItems,
      total_cost: Math.round(newTotal * 100) / 100,
      remaining_budget: Math.round(newRemaining * 100) / 100,
      budget_utilization: Math.round(newUtil * 10) / 10,
    })
  }

  const handleReplaceItem = async (indexToReplace) => {
    if (!currentPlan) return
    const itemToReplace = currentPlan.items[indexToReplace]
    const currentSlugs = currentPlan.items.map(it => it.slug)

    // Calculate maximum available price for replacement: item's current price + remaining budget
    const maxItemPrice = itemToReplace.price + currentPlan.remaining_budget

    try {
      const replacement = await plannerService.replaceItem({
        exclude_slugs: currentSlugs,
        category: itemToReplace.category,
        max_price: maxItemPrice,
        requirements: currentPlan.requirements,
      })

      const updatedItems = [...currentPlan.items]
      updatedItems[indexToReplace] = replacement

      const newTotal = updatedItems.reduce((sum, item) => sum + item.price, 0)
      const newRemaining = currentPlan.budget - newTotal
      const newUtil = currentPlan.budget > 0 ? (newTotal / currentPlan.budget) * 100 : 0

      setCurrentPlan({
        ...currentPlan,
        items: updatedItems,
        total_cost: Math.round(newTotal * 100) / 100,
        remaining_budget: Math.round(newRemaining * 100) / 100,
        budget_utilization: Math.round(newUtil * 10) / 10,
      })
      setSuccessMsg(`Replaced ${itemToReplace.name} with ${replacement.name}`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      alert(err.response?.data?.detail || 'No suitable alternative found in this price range.')
    }
  }

  const handleSavePlan = async () => {
    if (!user) {
      setError('Please sign in to save your shopping plan.')
      return
    }
    if (!currentPlan || currentPlan.items.length === 0) return

    setIsSaving(true)
    setError('')
    try {
      const payload = {
        name: planName || 'My Shopping Plan',
        budget: currentPlan.budget,
        total_cost: currentPlan.total_cost,
        requirements: currentPlan.requirements,
        categories: selectedCategories,
        items: currentPlan.items.map(it => ({
          product_id: it.product_id,
          ai_explanation: it.ai_explanation,
          price_at_addition: it.price,
        })),
      }
      const saved = await plannerService.savePlan(payload)
      setCurrentPlan(saved)
      setSuccessMsg('Shopping plan saved to your profile!')
      loadSavedPlans()
      setTimeout(() => setSuccessMsg(''), 3500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save plan.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddAllToCart = async () => {
    if (!user) {
      setError('Please sign in to add items to your cart.')
      return
    }
    if (!currentPlan) return

    setIsAddingCart(true)
    setError('')
    try {
      // If plan is not saved yet, save it first
      let planId = currentPlan.id
      if (!planId) {
        const payload = {
          name: planName || 'My Shopping Plan',
          budget: currentPlan.budget,
          total_cost: currentPlan.total_cost,
          requirements: currentPlan.requirements,
          categories: selectedCategories,
          items: currentPlan.items.map(it => ({
            product_id: it.product_id,
            ai_explanation: it.ai_explanation,
            price_at_addition: it.price,
          })),
        }
        const saved = await plannerService.savePlan(payload)
        planId = saved.id
        setCurrentPlan(saved)
      }

      const res = await plannerService.addAllToCart(planId)
      refreshCart?.()
      setSuccessMsg(`Successfully added ${res.added} items to your cart!`)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add items to cart.')
    } finally {
      setIsAddingCart(false)
    }
  }

  const handleViewSavedPlan = async (planId) => {
    try {
      const fullPlan = await plannerService.getPlan(planId)
      setCurrentPlan(fullPlan)
      setBudget(fullPlan.budget.toString())
      setRequirements(fullPlan.requirements)
      setPlanName(fullPlan.name)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      alert('Could not load plan details.')
    }
  }

  const handleDeleteSavedPlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this saved plan?')) return
    try {
      await plannerService.deletePlan(planId)
      setSavedPlans(prev => prev.filter(p => p.id !== planId))
      if (currentPlan?.id === planId) {
        setCurrentPlan(null)
      }
    } catch (err) {
      alert('Failed to delete plan.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="AI Smart Shopping Planner"
        description="Let Gemini AI curate the best combination of products tailored to your exact needs and budget."
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (5 columns) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BrainCircuit size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Planner Criteria</h3>
              <p className="text-xs text-slate-500">Configure your budget and setup needs</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Total Budget */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Total Budget Ceiling (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 80000"
                  className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            {/* What to purchase */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                What do you want to purchase? <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={3}
                placeholder="e.g. I need a laptop for computer science, wireless headphones, and a durable backpack or mouse."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition leading-relaxed resize-none"
                required
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Categories (multi-select)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_CATEGORIES.map(cat => {
                  const selected = selectedCategories.includes(cat.slug)
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => toggleCategory(cat.slug)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                        selected
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                        selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {selected && <Check size={10} />}
                      </div>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Preferred brands */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Brands (optional)
              </label>
              <input
                type="text"
                value={preferredBrands}
                onChange={(e) => setPreferredBrands(e.target.value)}
                placeholder="e.g. Apple, Sony, Dell (comma-separated)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            {/* Additional requirements */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Additional Requirements (optional)
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Prioritize lightweight laptops and long battery life"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full h-10 flex items-center justify-center gap-2 mt-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Generating Plan with AI...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Generate Shopping Plan
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Right Results Area (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium animate-fade-in">
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {!currentPlan && !isGenerating ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Your Curated Plan Will Appear Here</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Enter your total budget ceiling and shopping goals on the left. The AI will formulate an optimal bundle of products verified from the live catalog.
              </p>
            </div>
          ) : isGenerating ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
                <BrainCircuit size={28} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Evaluating Catalog & Allocating Budget...</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Cross-referencing specs, user ratings, in-stock availability, and enforcing strict budget bounds.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Budget KPI Banner */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="text-base font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition"
                    />
                    <p className="text-xs text-slate-500 mt-0.5">
                      Curated bundle ({currentPlan.items.length} items)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      title="Regenerate Plan"
                    >
                      <RefreshCw size={14} /> Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSavePlan}
                      disabled={isSaving}
                      title="Save Plan"
                    >
                      <Bookmark size={14} /> {isSaving ? 'Saving...' : 'Save Plan'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddAllToCart}
                      disabled={isAddingCart || currentPlan.items.length === 0}
                    >
                      <ShoppingCart size={14} /> {isAddingCart ? 'Adding...' : 'Add All to Cart'}
                    </Button>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Budget</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      ₹{currentPlan.budget.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-2.5 bg-blue-50 rounded-xl">
                    <p className="text-[10px] font-semibold text-blue-600 uppercase">Total Cost</p>
                    <p className="text-sm font-bold text-blue-700 mt-0.5">
                      ₹{currentPlan.total_cost.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl">
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase">Remaining</p>
                    <p className="text-sm font-bold text-emerald-700 mt-0.5">
                      ₹{currentPlan.remaining_budget.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-2.5 bg-purple-50 rounded-xl">
                    <p className="text-[10px] font-semibold text-purple-600 uppercase">Utilized</p>
                    <p className="text-sm font-bold text-purple-700 mt-0.5">
                      {currentPlan.budget_utilization}%
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentPlan.budget_utilization > 95
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(currentPlan.budget_utilization, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {currentPlan.items.map((item, idx) => (
                  <div
                    key={item.product_id || idx}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-xl border border-slate-100 shrink-0 bg-slate-50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {item.brand}
                              </span>
                              <Badge variant="primary">{item.category}</Badge>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                              {item.name}
                            </h4>
                          </div>
                          <p className="text-sm font-bold text-blue-600 whitespace-nowrap">
                            ₹{item.price.toLocaleString('en-IN')}
                          </p>
                        </div>

                        {/* AI Explanation Pill */}
                        <div className="mt-2 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-blue-900 leading-relaxed">
                          <span className="font-semibold text-blue-700">AI Choice: </span>
                          {item.ai_explanation}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100">
                          <Link
                            to={`/product/${item.slug}`}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-medium transition"
                          >
                            <Eye size={13} /> View Specs
                          </Link>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReplaceItem(idx)}
                              className="text-xs font-semibold text-slate-600 hover:text-blue-600 py-1 px-2 rounded-lg hover:bg-slate-100 transition"
                              title="Find alternative in this category within budget"
                            >
                              Replace
                            </button>
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="text-xs font-semibold text-rose-500 hover:text-rose-700 py-1 px-2 rounded-lg hover:bg-rose-50 transition"
                              title="Remove product"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Plans History Section */}
      {savedPlans.length > 0 && (
        <div className="pt-8 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Saved Shopping Plans</h3>
              <p className="text-xs text-slate-500">Access and re-evaluate your previously planned bundles</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedPlans.map(plan => (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{plan.name}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                    "{plan.requirements}"
                  </p>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs mb-3">
                    <span className="text-slate-500">{plan.item_count} items</span>
                    <span className="font-bold text-blue-600">₹{plan.total_cost.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewSavedPlan(plan.id)}
                  >
                    View Plan
                  </Button>
                  <button
                    onClick={() => handleDeleteSavedPlan(plan.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete saved plan"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
