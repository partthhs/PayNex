import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, GitCompare, Eye, Check } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useCompare } from '../../context/CompareContext'
import Badge from '../ui/Badge'
import PriceDisplay from '../ui/PriceDisplay'
import RatingStars from '../ui/RatingStars'

function imgFallback(e) {
  e.currentTarget.src = `https://placehold.co/400x300/EFF6FF/1D4ED8?text=Product`
}

export default function ProductCard({ product }) {
  const { addToCart, cartItems }       = useCart()
  const { addToCompare, isInCompare, compareItems } = useCompare()

  const [cartFlash,    setCartFlash]    = useState(false)
  const [compareFlash, setCompareFlash] = useState(false)

  const inCart    = cartItems.some(i => i.product.id === product.id)
  const inCompare = isInCompare(product.id)
  const maxed     = compareItems.length >= 4 && !inCompare

  const handleCart = () => {
    addToCart(product)
    setCartFlash(true)
    setTimeout(() => setCartFlash(false), 1500)
  }

  const handleCompare = () => {
    if (maxed) return
    addToCompare(product)
    setCompareFlash(true)
    setTimeout(() => setCompareFlash(false), 1500)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex flex-col overflow-hidden h-full">
      {/* Image */}
      <div className="relative overflow-hidden bg-slate-50 h-48 w-full shrink-0">
        <img
          src={product.image}
          alt={product.name}
          onError={imgFallback}
          className="w-full h-full object-cover"
        />
        {product.badge && (
          <div className="absolute top-2.5 left-2.5">
            <Badge variant={product.badge === 'Deal' ? 'success' : product.badge === 'New' ? 'sky' : 'primary'}>
              {product.badge}
            </Badge>
          </div>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{product.brand}</p>
        <h3 className="text-sm font-semibold text-slate-900 mb-1 leading-snug line-clamp-2 h-10">{product.name}</h3>
        <p className="text-xs text-slate-500 mb-2.5 line-clamp-2 leading-relaxed h-8">{product.shortDescription}</p>
        
        <div className="mb-2">
          <RatingStars rating={product.rating} reviews={product.reviews} size="sm" />
        </div>

        <div className="mb-4 min-h-[1.75rem] flex items-center">
          <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="sm" />
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-2 pt-3 border-t border-slate-200">
          <button
            onClick={handleCart}
            disabled={!product.inStock}
            className={[
              'w-full h-9 flex items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors',
              cartFlash
                ? 'bg-green-600 text-white'
                : inCart
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
              !product.inStock ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          >
            {cartFlash
              ? <><Check size={14} /> Added to Cart</>
              : <><ShoppingCart size={14} /> {inCart ? 'Added in Cart' : 'Add to Cart'}</>
            }
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleCompare}
              disabled={maxed}
              title={maxed ? 'Maximum 4 items' : inCompare ? 'Added to compare' : 'Compare'}
              className={[
                'flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium border transition-colors',
                compareFlash || inCompare
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 bg-white',
                maxed ? 'opacity-40 cursor-not-allowed' : '',
              ].join(' ')}
            >
              <GitCompare size={12} />
              {inCompare ? 'Compared' : 'Compare'}
            </button>

            <Link
              to={`/product/${product.id}`}
              className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 bg-white transition-colors"
            >
              <Eye size={12} /> Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
