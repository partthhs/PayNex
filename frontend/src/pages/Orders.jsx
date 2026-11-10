import { Link } from 'react-router-dom'
import { Package, Info } from 'lucide-react'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'

const DEMO_ORDER = {
  id: 'PAY-DEMO-001',
  date: 'Demo entry',
  status: 'Pending',
  item: 'MacBook Air M3',
  total: '₹1,19,900',
}

export default function Orders() {
  return (
    <div>
      <PageHeader
        title="My Orders"
        description="Your order history and status"
      />

      <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5">
        <Info size={15} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Order history will be populated after backend and payment integration in Phase 3–5.
        </p>
      </div>

      {/* Empty state for real orders */}
      <EmptyState
        icon={<Package size={28} />}
        title="No orders yet"
        description="Your order history will appear here once you complete purchases."
        action={
          <Link to="/explore">
            <Button variant="primary" size="md">Explore Products</Button>
          </Link>
        }
      />

      {/* Demo order example */}
      <div className="mt-8">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order History Schema Preview</p>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Order #{DEMO_ORDER.id}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{DEMO_ORDER.date}</p>
            </div>
            <Badge variant="warning">{DEMO_ORDER.status}</Badge>
          </div>
          <div className="flex items-center gap-3 py-3 border-t border-slate-200">
            <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
              <Package size={18} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-slate-800">{DEMO_ORDER.item}</p>
              <p className="text-xs text-slate-400">Qty: 1</p>
            </div>
            <span className="text-sm font-bold text-slate-900">{DEMO_ORDER.total}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 text-center">
            Demonstration entry. Real orders will populate following backend order placement.
          </p>
        </div>
      </div>
    </div>
  )
}
