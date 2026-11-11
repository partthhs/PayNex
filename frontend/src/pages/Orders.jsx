import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Package, CheckCircle } from 'lucide-react'
import { orderService, paymentService } from '../services/orderService'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'

const INR = (n) => '₹' + n.toLocaleString('en-IN')

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [_loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [notification, setNotification] = useState(null)
  const { isAuthenticated } = useAuth()
  const { clearCart, refreshCart } = useCart()
  const capturedRef = useRef(false)

  useEffect(() => {
    async function load() {
      // Check for PayPal return params
      const paypalToken = searchParams.get('token')
      if (paypalToken && searchParams.get('paypal_success') && !capturedRef.current) {
        capturedRef.current = true
        try {
          const res = await paymentService.capturePayment(paypalToken)
          clearCart()
          refreshCart?.()
          setNotification({
            type: 'success',
            text: `Payment successfully captured! Order #${res.order_id} is confirmed.`,
          })
          // Clean URL params cleanly
          navigate('/orders', { replace: true })
        } catch (e) {
          setNotification({
            type: 'error',
            text: e.response?.data?.detail || 'Payment capture failed.',
          })
        }
      }

      if (isAuthenticated) {
        try {
          const data = await orderService.getOrders()
          setOrders(data)
        } catch (err) {
          console.warn('Could not load orders:', err)
        }
      }
      setLoading(false)
    }
    load()
  }, [isAuthenticated, searchParams])

  return (
    <div>
      <PageHeader
        title="My Orders"
        description="Your verified order history and delivery statuses"
      />

      {notification && (
        <div className={`mb-5 p-4 rounded-xl text-sm border flex items-center gap-2.5 ${
          notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <CheckCircle size={16} />
          <span>{notification.text}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package size={28} />}
          title={isAuthenticated ? 'No orders yet' : 'Sign in to view orders'}
          description={
            isAuthenticated
              ? 'Your order history will appear here once you complete purchases.'
              : 'Log in with your PayNex account to track your orders, payments, and delivery statuses.'
          }
          action={
            <Link to={isAuthenticated ? '/explore' : '/login'}>
              <Button variant="primary" size="md">
                {isAuthenticated ? 'Explore Products' : 'Sign In'}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
            const isConfirmed = order.status === 'confirmed'

            return (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">Order #{order.id}</p>
                      <Badge variant={isConfirmed ? 'success' : 'warning'}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Placed on {dateStr}</p>
                  </div>

                  <div className="text-right sm:text-right">
                    <p className="text-xs text-slate-400">Total Amount</p>
                    <p className="text-base font-bold text-blue-700">{INR(order.total)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-1">
                      <img
                        src={item.product_image || 'https://placehold.co/48x48/EFF6FF/1D4ED8?text=P'}
                        alt={item.product_name}
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/48x48/EFF6FF/1D4ED8?text=P' }}
                        className="w-12 h-12 object-cover rounded-lg bg-slate-50 border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{item.product_name}</p>
                        <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">{INR(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Shipping & Payment summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <span>Shipping to: <strong className="text-slate-700">{order.shipping_name || 'Customer'}</strong> ({order.shipping_city}, {order.shipping_state})</span>
                  <span>Payment: <strong className="text-slate-700">{order.payment ? order.payment.status.toUpperCase() : 'PENDING'}</strong></span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
