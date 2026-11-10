import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import { useCart } from '../context/CartContext'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'

const INR = (n) => '₹' + n.toLocaleString('en-IN')

function FormField({ label, type = 'text', placeholder, value, onChange, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-10 w-full px-3.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors"
      />
    </div>
  )
}

export default function Checkout() {
  const { cartItems, cartTotal } = useCart()

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address1: '', address2: '', city: '', state: '', pincode: '',
  })

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

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
              <FormField label="Full Name" value={form.name} onChange={set('name')} placeholder="Jane Doe" className="sm:col-span-2" />
              <FormField label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
              <FormField label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 00000 00000" />
              <FormField label="Address Line 1" value={form.address1} onChange={set('address1')} placeholder="Flat / House No, Street" className="sm:col-span-2" />
              <FormField label="Address Line 2 (Optional)" value={form.address2} onChange={set('address2')} placeholder="Locality, Landmark" className="sm:col-span-2" />
              <FormField label="City" value={form.city} onChange={set('city')} placeholder="Mumbai" />
              <FormField label="State" value={form.state} onChange={set('state')} placeholder="Maharashtra" />
              <FormField label="PIN Code" value={form.pincode} onChange={set('pincode')} placeholder="400001" className="sm:col-span-2" />
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
                <p className="text-xs font-bold text-blue-900 mb-1">PayPal Orders Integration</p>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  PayPal gateway integration will be connected in Phase 5. No credentials or charges are processed during this phase.
                </p>
              </div>
              <Button variant="secondary" size="md" fullWidth disabled className="text-xs font-semibold">
                Authorize via PayPal (Phase 5)
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
          This checkout interface demonstrates the order-review process. No real payment credentials are collected.
        </p>
      </div>
    </div>
  )
}
