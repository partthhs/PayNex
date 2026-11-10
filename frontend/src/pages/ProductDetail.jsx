import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, GitCompare, ArrowLeft, Check, Minus, Plus } from 'lucide-react'
import { getProductById, getSimilarProducts } from '../data/products'
import { productService } from '../services/productService'
import { useCart } from '../context/CartContext'
import { useCompare } from '../context/CompareContext'
import PriceDisplay from '../components/ui/PriceDisplay'
import RatingStars from '../components/ui/RatingStars'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import ProductCard from '../components/products/ProductCard'
import Button from '../components/ui/Button'

function imgFallback(e) {
  e.currentTarget.src = 'https://placehold.co/500x400/EFF6FF/1D4ED8?text=Product'
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(() => getProductById(id))

  useEffect(() => {
    async function fetchDetail() {
      try {
        const p = await productService.getProductBySlug(id)
        if (p) setProduct(p)
      } catch {
        // Keep local fallback
        const local = getProductById(id)
        if (local) setProduct(local)
      }
    }
    fetchDetail()
  }, [id])

  const { addToCart, cartItems }              = useCart()
  const { addToCompare, isInCompare, compareItems } = useCompare()

  const [qty,         setQty]         = useState(1)
  const [cartAdded,   setCartAdded]   = useState(false)
  const [compAdded,   setCompAdded]   = useState(false)

  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        description="The product you're looking for doesn't exist or has been removed."
        action={
          <Button variant="outline" onClick={() => navigate('/explore')}>
            <ArrowLeft size={16} /> Back to Explore
          </Button>
        }
      />
    )
  }

  const inCart    = cartItems.some(i => i.product.id === product.id)
  const inCompare = isInCompare(product.id)
  const similar   = getSimilarProducts(product)

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product)
    setCartAdded(true)
    setTimeout(() => setCartAdded(false), 2000)
  }

  const handleCompare = () => {
    if (compareItems.length >= 4 && !inCompare) return
    addToCompare(product)
    setCompAdded(true)
    setTimeout(() => setCompAdded(false), 2000)
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Image */}
          <div className="lg:w-2/5 shrink-0">
            <div className="relative rounded-lg overflow-hidden bg-slate-50 aspect-square border border-slate-200">
              <img
                src={product.image}
                alt={product.name}
                onError={imgFallback}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <div className="absolute top-3 left-3">
                  <Badge variant={product.badge === 'Deal' ? 'success' : product.badge === 'New' ? 'sky' : 'primary'}>
                    {product.badge}
                  </Badge>
                </div>
              )}
              {!product.inStock && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Out of Stock</span>
                </div>
              )}
            </div>
            {/* In stock pill */}
            {product.inStock && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-green-700 font-medium">
                <Check size={14} className="text-green-600" />
                <span>Verified Available in Catalog</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{product.brand}</p>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">{product.name}</h1>
            <RatingStars rating={product.rating} reviews={product.reviews} size="md" />

            <div className="mt-3 mb-4">
              <PriceDisplay price={product.price} originalPrice={product.originalPrice} size="lg" />
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">{product.description}</p>

            {/* Features */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Key Features</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <Check size={14} className="text-blue-600 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity + Cart */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="h-10 flex items-center gap-2 border border-slate-200 rounded-lg px-3 bg-slate-50 shrink-0">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="text-slate-500 hover:text-slate-800 disabled:opacity-30 p-0.5"
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-900">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(10, q + 1))}
                  className="text-slate-500 hover:text-slate-800 disabled:opacity-30 p-0.5"
                  disabled={qty >= 10}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1"
              >
                {cartAdded
                  ? <><Check size={15} /> Added to Cart</>
                  : <><ShoppingCart size={15} /> {inCart ? 'Add More to Cart' : 'Add to Cart'}</>
                }
              </Button>
            </div>

            <Button
              variant={inCompare ? 'secondary' : 'outline'}
              size="md"
              fullWidth
              onClick={handleCompare}
              disabled={compareItems.length >= 4 && !inCompare}
            >
              <GitCompare size={15} />
              {compAdded || inCompare ? 'Added to Comparison List' : 'Add to Comparison List'}
              {compareItems.length >= 4 && !inCompare && ' (Max 4 Items)'}
            </Button>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {Object.keys(product.specs).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Technical Specifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="flex items-start py-2.5 border-b border-slate-200 text-xs">
                <span className="font-semibold text-slate-500 uppercase tracking-wide w-36 shrink-0">{k}</span>
                <span className="text-slate-800 flex-1">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Similar Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similar.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
