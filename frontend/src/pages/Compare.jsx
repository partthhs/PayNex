import { Link } from 'react-router-dom'
import { X, Plus, Trash2 } from 'lucide-react'
import { useCompare } from '../context/CompareContext'
import { useCart } from '../context/CartContext'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import PriceDisplay from '../components/ui/PriceDisplay'
import RatingStars from '../components/ui/RatingStars'
import PageHeader from '../components/ui/PageHeader'

function imgFallback(e) {
  e.currentTarget.src = 'https://placehold.co/120x120/EFF6FF/1D4ED8?text=Product'
}

export default function Compare() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare()
  const { addToCart } = useCart()

  if (compareItems.length === 0) {
    return (
      <EmptyState
        title="No products to compare"
        description="Add products from Explore or Product Details to compare them side by side."
        action={
          <Link to="/explore">
            <Button variant="primary">Explore Products</Button>
          </Link>
        }
      />
    )
  }

  // All spec keys union
  const allSpecKeys = [...new Set(compareItems.flatMap(p => Object.keys(p.specs || {})))]
  const cheapest    = compareItems.reduce((a, b) => a.price < b.price ? a : b)

  return (
    <div>
      <PageHeader
        title={`Comparing ${compareItems.length} Product${compareItems.length > 1 ? 's' : ''}`}
        description="Side-by-side comparison to help you decide"
        actions={
          <Button variant="ghost" size="sm" onClick={clearCompare}>
            <Trash2 size={14} /> Clear All
          </Button>
        }
      />

      <div className="overflow-x-auto pb-4">
        <div className="min-w-max">
          {/* Product headers */}
          <div className="grid gap-4 mb-4 px-3" style={{ gridTemplateColumns: `160px repeat(${compareItems.length}, minmax(240px, 1fr))` }}>
            <div className="flex items-end pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Features</div>
            {compareItems.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 relative shadow-sm flex flex-col justify-between">
                <button
                  onClick={() => removeFromCompare(p.id)}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center transition-colors"
                  title="Remove from comparison"
                >
                  <X size={13} />
                </button>
                <div>
                  <div className="w-full h-32 rounded-lg bg-slate-50 mb-3 flex items-center justify-center p-2 border border-slate-100">
                    <img
                      src={p.image} alt={p.name} onError={imgFallback}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{p.brand}</p>
                  <p className="text-sm font-bold text-slate-900 mb-2 leading-snug line-clamp-2 h-10">{p.name}</p>
                  <div className="mb-2">
                    <RatingStars rating={p.rating} reviews={p.reviews} size="sm" />
                  </div>
                  <div className="mb-2">
                    <PriceDisplay price={p.price} originalPrice={p.originalPrice} size="sm" />
                  </div>
                  <div className="h-6 mb-2 flex items-center">
                    {p.id === cheapest.id && (
                      <Badge variant="success">Best Value Option</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="primary" size="sm" fullWidth
                  className="mt-2"
                  onClick={() => addToCart(p)}
                >
                  Add to Cart
                </Button>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          {[
            { label: 'Category', key: 'cat', render: p => <span className="capitalize text-slate-800 text-xs font-medium">{p.category}</span> },
            { label: 'Rating',   key: 'rating', render: p => <RatingStars rating={p.rating} /> },
            { label: 'Price',    key: 'price',  render: p => <PriceDisplay price={p.price} originalPrice={p.originalPrice} size="sm" /> },
            { label: 'Availability', key: 'stock', render: p => p.inStock
              ? <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">In Stock</span>
              : <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Out of Stock</span> },
            ...allSpecKeys.map(sk => ({
              label: sk,
              key: sk,
              render: p => <span className="text-xs text-slate-700">{p.specs?.[sk] || <span className="text-slate-300">—</span>}</span>,
            })),
          ].map(row => (
            <div
              key={row.key}
              className="grid gap-4 py-3 border-b border-slate-200 bg-white px-3 rounded-lg mb-1.5"
              style={{ gridTemplateColumns: `160px repeat(${compareItems.length}, minmax(240px, 1fr))` }}
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center">{row.label}</div>
              {compareItems.map(p => (
                <div key={p.id} className="flex items-center text-xs text-slate-800">{row.render(p)}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Add more prompt */}
      {compareItems.length < 4 && (
        <div className="mt-6 p-6 border border-dashed border-slate-200 bg-white rounded-xl text-center">
          <p className="text-xs font-medium text-slate-500 mb-3">
            Add up to {4 - compareItems.length} more item{4 - compareItems.length > 1 ? 's' : ''} to compare specifications.
          </p>
          <Link to="/explore">
            <Button variant="outline" size="sm">
              <Plus size={14} /> Add from Catalog
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
