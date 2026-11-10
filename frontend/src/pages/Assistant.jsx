import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Send, Zap, Info, X, Trash2, GitCompare, DollarSign, SlidersHorizontal, ShoppingCart, Eye } from 'lucide-react'
import { PRODUCTS, searchProducts } from '../data/products'
import { SUGGESTED_PROMPTS } from '../data/sampleData'
import { useCompare } from '../context/CompareContext'
import { useCart } from '../context/CartContext'
import { aiService } from '../services/aiService'
import Button from '../components/ui/Button'
import PriceDisplay from '../components/ui/PriceDisplay'

let msgId = 0
const newId = () => ++msgId

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center px-3 py-2">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}

function ContextPanel({ budget, setBudget, prefs, setPrefs, compareItems, removeFromCompare }) {
  return (
    <div className="space-y-4">
      {/* Budget */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={16} className="text-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Budget Ceiling</h3>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
          <input
            type="number"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="e.g. 70000"
            className="h-9 w-full pl-7 pr-3 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {budget ? `Max budget: ₹${parseInt(budget, 10).toLocaleString('en-IN')}` : 'No ceiling set'}
        </p>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Filter Preferences</h3>
        <div className="space-y-2">
          {[
            { key: 'trusted', label: 'Established brands only' },
            { key: 'value',   label: 'Prioritize price-to-performance' },
            { key: 'newer',   label: 'Recent product releases' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={e => setPrefs(p => ({ ...p, [key]: e.target.checked }))}
                className="accent-blue-600 rounded w-3.5 h-3.5"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Selected for compare */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitCompare size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Compare Queue</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{compareItems.length}/4</span>
        </div>
        {compareItems.length === 0 ? (
          <p className="text-xs text-slate-400">No items added to compare.</p>
        ) : (
          <div className="space-y-2">
            {compareItems.map(p => (
              <div key={p.id} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="flex-1 truncate font-medium">{p.name}</span>
                <button
                  onClick={() => removeFromCompare(p.id)}
                  className="text-slate-400 hover:text-red-500 p-0.5"
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <Link to="/compare">
              <Button variant="outline" size="sm" fullWidth className="mt-2 text-xs">
                Open Comparison Table
              </Button>
            </Link>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 text-center">Settings apply to the current active session.</p>
    </div>
  )
}

export default function Assistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [budget, setBudget] = useState('')
  const [prefs, setPrefs] = useState({ trusted: false, value: false, newer: false })
  const [panelOpen, setPanelOpen] = useState(false)
  const bottomRef = useRef(null)

  const { compareItems, removeFromCompare } = useCompare()
  const { addToCart } = useCart()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const findProducts = (query) => {
    const q = query.toLowerCase()
    const budgetMatch = q.match(/[₹]?\s*(\d[\d,]*)\s*k?/)
    let maxPrice = budget ? parseInt(budget.replace(/,/g, ''), 10) : Infinity
    if (budgetMatch) {
      let val = parseInt(budgetMatch[1].replace(/,/g, ''), 10)
      if (q.includes('k')) val *= 1000
      if (val > 1000) maxPrice = val
    }

    let results = searchProducts(query)
    if (maxPrice !== Infinity) results = results.filter(p => p.price <= maxPrice)
    return results.slice(0, 3)
  }

  const [conversationId, setConversationId] = useState(null)

  const send = async (text = input.trim()) => {
    if (!text) return
    const userMsg = { id: newId(), role: 'user', text }
    setMessages(m => [...m, userMsg])
    setInput('')
    setTyping(true)

    try {
      const res = await aiService.chat({
        message: text,
        budget: budget ? parseFloat(budget) : null,
        conversationId,
      })
      if (res.conversation_id) setConversationId(res.conversation_id)

      const normalizedProducts = (res.products || []).map(p => ({
        ...p,
        id: p.slug || String(p.id),
        image: p.image_url || p.image,
        originalPrice: p.original_price ?? p.originalPrice,
      }))

      const aiMsg = {
        id: newId(),
        role: 'ai',
        text: res.message,
        products: normalizedProducts,
        note: res.note || 'AI evaluated from verified product catalog.',
      }
      setMessages(m => [...m, aiMsg])
    } catch {
      // Graceful local fallback if offline or backend error
      const products = findProducts(text)
      const aiMsg = {
        id: newId(),
        role: 'ai',
        text: products.length
          ? `Found ${products.length} matching product${products.length > 1 ? 's' : ''} based on your specifications:`
          : `No exact specification matches found within that filter. Here are recommended alternatives:`,
        products: products.length ? products : PRODUCTS.slice(0, 3),
        note: 'Recommendations evaluated from local catalog.',
      }
      setMessages(m => [...m, aiMsg])
    } finally {
      setTyping(false)
    }
  }

  const clear = () => setMessages([])

  return (
    <div className="flex gap-6 h-[calc(100vh-8.5rem)] min-h-[500px]">
      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">AI Shopping Assistant</p>
              <p className="text-[11px] text-green-600 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Active Session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPanelOpen(o => !o)}
              className="lg:hidden flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <SlidersHorizontal size={13} />
              <span>Filters</span>
            </button>
            {messages.length > 0 && (
              <button
                onClick={clear}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-600 px-2 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Purchase control disclaimer banner */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <Info size={13} className="text-blue-600 shrink-0" />
          <p className="text-xs text-slate-600">
            PayNex assists your shopping evaluation. <strong>You approve every purchase before checkout.</strong>
          </p>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 max-w-lg mx-auto">
              <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                <Zap size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">What are you looking to buy?</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed max-w-sm">
                Describe your specifications, target price, or preferred category to receive matched recommendations.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="text-xs text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl p-3 transition-colors text-left"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-blue-700">AI</span>
                </div>
              )}
              <div className={`max-w-[95%] sm:max-w-[85%] ${msg.products ? 'w-full sm:max-w-2xl lg:max-w-3xl' : ''} space-y-3 ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className={[
                  'px-4 py-2.5 text-xs sm:text-sm leading-relaxed rounded-2xl',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-sm',
                ].join(' ')}>
                  {msg.text}
                </div>

                {/* Compact product recommendations */}
                {msg.products && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
                    {msg.products.map(p => (
                      <div
                        key={p.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-sm"
                      >
                        <div className="flex gap-2.5 items-start mb-2">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-50 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">{p.brand}</span>
                            <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                            <PriceDisplay price={p.price} originalPrice={p.originalPrice} size="sm" />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200">
                          <button
                            onClick={() => addToCart(p)}
                            className="flex-1 h-7 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1 transition-colors"
                          >
                            <ShoppingCart size={12} /> Add
                          </button>
                          <Link
                            to={`/product/${p.id}`}
                            className="h-7 px-2.5 text-[11px] font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1 transition-colors"
                          >
                            <Eye size={12} /> View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.note && (
                  <p className="text-[11px] text-slate-400 italic">{msg.note}</p>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-2.5 items-center">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-blue-700">AI</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-slate-200 px-4 py-3 bg-white shrink-0">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send() }}
              placeholder="Type your requirements (e.g. laptop under 70k for coding)..."
              className="h-10 flex-1 text-xs sm:text-sm border border-slate-200 rounded-lg px-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim()}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop context sidebar */}
      <div className="hidden lg:block w-72 shrink-0 overflow-y-auto">
        <ContextPanel
          budget={budget} setBudget={setBudget}
          prefs={prefs} setPrefs={setPrefs}
          compareItems={compareItems} removeFromCompare={removeFromCompare}
        />
      </div>

      {/* Mobile context drawer modal */}
      {panelOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setPanelOpen(false)} />
          <div className="relative ml-auto w-72 h-full bg-slate-50 p-4 overflow-y-auto z-10 border-l border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Shopping Context</span>
              <button onClick={() => setPanelOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={16} />
              </button>
            </div>
            <ContextPanel
              budget={budget} setBudget={setBudget}
              prefs={prefs} setPrefs={setPrefs}
              compareItems={compareItems} removeFromCompare={removeFromCompare}
            />
          </div>
        </div>
      )}
    </div>
  )
}
