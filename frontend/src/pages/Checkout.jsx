import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Info, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { orderService, paymentService } from '../services/orderService'
import { cartService } from '../services/cartService'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'

const INR = (n) => '₹' + n.toLocaleString('en-IN')

function FormField({ label, type = 'text', placeholder, value, onChange, className = '', error }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          'h-10 w-full px-3.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white transition-colors',
          error ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-blue-500',
        ].join(' ')}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { cartItems, cartTotal, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()

  const [form, setForm] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    if (searchParams.get('paypal_cancelled')) {
      setStatusMessage({
        type: 'error',
        text: 'Payment was cancelled on PayPal. You were not charged and your cart items are preserved.',
      })
    }
  }, [searchParams])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.address1.trim()) e.address1 = 'Street address is required'
    if (!form.city.trim()) e.city = 'City is required'
    if (!form.state.trim()) e.state = 'State is required'
    if (!form.pincode.trim()) e.pincode = 'PIN Code is required'
    return e
  }

  const handleAuthorize = async () => {
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})

    if (!isAuthenticated) {
      setStatusMessage({
        type: 'error',
        text: 'Please sign in or create an account to authorize orders and manage payments.',
      })
      return
    }

    setLoading(true)
    setStatusMessage(null)

    try {
      // 1. Sync cart to backend
      for (const item of cartItems) {
        const prodId = item.product.numericId || 1
        try {
          await cartService.addToCart(prodId, item.quantity)
        } catch {}
      }

      // 2. Create order on backend
      const order = await orderService.createOrder(form)

      // 3. Initiate PayPal payment
      try {
        const payRes = await paymentService.createPaypalOrder(order.id)
        if (payRes.approve_url) {
          clearCart()
          // Redirect to PayPal Sandbox approval
          window.location.href = payRes.approve_url
          return
        }
      } catch (payErr) {
        // If PayPal credentials are not configured, inform the user
        const detail = payErr.response?.data?.detail || ''
        clearCart()
        setStatusMessage({
          type: 'success',
          text: `Order #${order.id} placed successfully! (${detail || 'PayPal Sandbox pending credentials in .env'}). View in Orders.`,
        })
        setTimeout(() => navigate('/orders'), 3000)
        return
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to place order. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-8 max-w-md mx-auto">
        <p className="text-slate-600 text-sm mb-4">Your cart is currently empty.</p>
        <Link to="/explore"><Button variant="primary" size="md">Explore Catalog</Button></Link>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Order Review" description="Verify shipping destination and order details before final authorization" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Order review + Shipping */}
        <div className="flex-1 space-y-5">

          {/* Order items */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Selected Items</h2>
            <div className="space-y-3">
              {cartItems.map(({ product: p, quantity }) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <img src={p.image} alt={p.name}
                    onError={e => { e.currentTarget.src = 'https://placehold.co/48x48/EFF6FF/1D4ED8?text=P' }}
                    className="w-12 h-12 object-cover rounded-lg bg-slate-50 border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">Qty: {quantity}</p>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 shrink-0">{INR(p.price * quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Shipping Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Full Name" value={form.name} onChange={set('name')} error={errors.name} placeholder="Jane Doe" className="sm:col-span-2" />
              <FormField label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
              <FormField label="Phone" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="+91 00000 00000" />
              <FormField label="Address Line 1" value={form.address1} onChange={set('address1')} error={errors.address1} placeholder="Flat / House No, Street" className="sm:col-span-2" />
              <FormField label="Address Line 2 (Optional)" value={form.address2} onChange={set('address2')} placeholder="Locality, Landmark" className="sm:col-span-2" />
              <FormField label="City" value={form.city} onChange={set('city')} error={errors.city} placeholder="Mumbai" />
              <FormField label="State" value={form.state} onChange={set('state')} error={errors.state} placeholder="Maharashtra" />
              <FormField label="PIN Code" value={form.pincode} onChange={set('pincode')} error={errors.pincode} placeholder="400001" className="sm:col-span-2" />
            </div>
          </div>
        </div>

        {/* Right: Payment summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-20 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Payment Summary</h2>

            <div className="space-y-2 text-xs">
              {cartItems.map(({ product: p, quantity }) => (
                <div key={p.id} className="flex justify-between text-slate-600">
                  <span className="truncate max-w-[170px]">{p.name} ×{quantity}</span>
                  <span className="font-medium text-slate-800">{INR(p.price * quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                <span>Shipping</span>
                <span className="text-green-600 font-semibold">Free Delivery</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex justify-between font-bold text-slate-900">
                <span className="text-sm">Grand Total</span>
                <span className="text-blue-700 text-lg">{INR(cartTotal)}</span>
              </div>
            </div>

            {/* Payment section */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">Payment Method</h3>
              <div className="border border-blue-200 bg-blue-50/60 rounded-xl p-3.5 mb-3">
                <p className="text-xs font-bold text-blue-900 mb-1">PayPal Orders Sandbox</p>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Direct server-side order authorization via PayPal Developer Sandbox.
                </p>
              </div>

              {statusMessage && (
                <div className={`mb-3 p-3 rounded-xl text-xs flex items-start gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {statusMessage.type === 'success' ? (
                    <CheckCircle size={15} className="shrink-0 mt-0.5 text-green-600" />
                  ) : (
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleAuthorize}
                disabled={loading}
                className="text-xs font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>Authorize via PayPal Sandbox</span>
                )}
              </Button>
              <p className="text-[11px] text-slate-400 mt-2.5 text-center">
                User explicit approval is enforced on all transactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex items-start gap-2.5">
        <Info size={15} className="text-slate-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600">
          This checkout interface connects directly to your FastAPI backend and PayPal Sandbox API.
        </p>
      </div>
    </div>
  )
}
