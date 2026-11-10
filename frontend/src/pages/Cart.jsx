import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, Shield } from 'lucide-react'
import { useCart } from '../context/CartContext'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'

const INR = (n) => '₹' + n.toLocaleString('en-IN')

function imgFallback(e) {
  e.currentTarget.src = 'https://placehold.co/80x80/EFF6FF/1D4ED8?text=P'
}

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart()

  const savings = cartItems.reduce((s, { product: p, quantity }) =>
    p.originalPrice ? s + (p.originalPrice - p.price) * quantity : s, 0
  )

  if (cartItems.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={28} />}
        title="Your cart is empty"
        description="Browse our products and add items to your cart."
        action={
          <Link to="/explore">
            <Button variant="primary">Start Exploring</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Shopping Cart"
        description={`${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in your cart`}
        actions={
          <Button variant="ghost" size="sm" onClick={clearCart}>
            <Trash2 size={14} /> Clear Cart
          </Button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items */}
        <div className="flex-1 space-y-3">
          {cartItems.map(({ product: p, quantity }) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-4 items-center">
              <img
                src={p.image} alt={p.name} onError={imgFallback}
                className="w-20 h-20 object-cover rounded-lg bg-slate-50 border border-slate-100 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{p.brand}</p>
                <p className="text-sm font-semibold text-slate-900 mb-1 leading-snug">{p.name}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {/* Qty */}
                  <div className="h-8 flex items-center gap-2 border border-slate-200 rounded-lg px-2 bg-slate-50">
                    <button
                      onClick={() => updateQuantity(p.id, quantity - 1)}
                      className="text-slate-500 hover:text-slate-800 disabled:opacity-30 p-0.5"
                      disabled={quantity <= 1}
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold text-slate-900 w-5 text-center">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(p.id, quantity + 1)}
                      className="text-slate-500 hover:text-slate-800 disabled:opacity-30 p-0.5"
                      disabled={quantity >= 10}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  {/* Price */}
                  <div>
                    <span className="text-sm font-bold text-blue-700">{INR(p.price * quantity)}</span>
                    {quantity > 1 && (
                      <span className="text-xs text-slate-400 ml-1">({INR(p.price)} each)</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Remove */}
              <button
                onClick={() => removeFromCart(p.id)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Remove item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-20">
            <h2 className="text-base font-bold text-slate-900 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between text-slate-600 text-xs">
                <span>Subtotal ({cartItems.length} items)</span>
                <span className="font-semibold text-slate-800">{INR(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-xs">
                <span>Shipping</span>
                <span className="text-green-600 font-semibold">Calculated at checkout</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-600 text-xs font-semibold">
                  <span>Total Savings</span>
                  <span>-{INR(savings)}</span>
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 pt-3 mb-5">
              <div className="flex justify-between font-bold text-slate-900">
                <span className="text-sm">Estimated Total</span>
                <span className="text-blue-700 text-lg">{INR(cartTotal)}</span>
              </div>
            </div>
            <Link to="/checkout">
              <Button variant="primary" size="md" fullWidth>Proceed to Checkout</Button>
            </Link>
            <Link to="/explore">
              <Button variant="ghost" size="sm" fullWidth className="mt-2">Continue Shopping</Button>
            </Link>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400 justify-center">
              <Shield size={12} />
              <span>Checkout security review applied</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
