import { Link } from 'react-router-dom'
import {
  MessageSquare, Search, Check, Zap, ArrowRight,
  GitCompare, PiggyBank, TrendingDown, ShieldCheck, ShoppingBag,
  Star, Send, Sliders, CheckCircle2
} from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import Button from '../components/ui/Button'

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Natural Language Search',
    desc: 'Describe what you need in everyday language and discover matching products.'
  },
  {
    icon: GitCompare,
    title: 'Side-by-Side Comparison',
    desc: 'Compare technical specifications, ratings and prices directly across products.'
  },
  {
    icon: PiggyBank,
    title: 'Budget Discipline',
    desc: 'Define your budget ceiling and explore options strictly within your target range.'
  },
  {
    icon: TrendingDown,
    title: 'Price Transparency',
    desc: 'View authentic prices, original values and discounts with complete clarity.'
  },
  {
    icon: ShieldCheck,
    title: 'Explicit Purchase Approval',
    desc: 'Every transaction requires your review and confirmation before proceeding.'
  },
  {
    icon: ShoppingBag,
    title: 'Multi-Category Catalog',
    desc: 'Browse laptops, smartphones, audio gear, tablets, cameras and accessories.'
  }
]

const STEPS = [
  {
    num: '01',
    icon: MessageSquare,
    title: 'Describe Requirements',
    desc: 'Specify your needs, preferred brand, or target budget in plain language.'
  },
  {
    num: '02',
    icon: Search,
    title: 'Evaluate & Compare',
    desc: 'Review filtered specifications, ratings, and side-by-side product metrics.'
  },
  {
    num: '03',
    icon: Check,
    title: 'Authorize Purchase',
    desc: 'Add preferred items to your cart and review details before final payment.'
  }
]

const WHY_POINTS = [
  'Zero sponsored placements or paid product priority',
  'Transparent pricing without hidden calculations',
  'Objective comparisons based on verified technical specs',
  'User-controlled purchase confirmation for every order'
]

function HeroCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full max-w-sm mx-auto">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">PayNex Assistant</p>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Active
          </p>
        </div>
      </div>

      {/* Chat body */}
      <div className="p-4 space-y-3 bg-white min-h-[220px]">
        {/* User bubble */}
        <div className="flex justify-end">
          <div className="bg-blue-600 text-white text-xs rounded-xl px-3.5 py-2 max-w-[85%] leading-relaxed">
            Find a laptop under ₹70,000 for programming
          </div>
        </div>

        {/* AI bubble */}
        <div className="flex gap-2 items-start">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[9px] font-bold text-blue-700">AI</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3.5 py-2 max-w-[85%] leading-relaxed">
            Found top options matching programming requirements within your budget:
          </div>
        </div>

        {/* Mini product preview card */}
        <div className="ml-8 border border-slate-200 rounded-xl p-3 bg-slate-50">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-lg shrink-0">
              💻
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">MacBook Air M3</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={10} className="text-amber-400 fill-amber-400" />
                <span className="text-[11px] text-slate-500 font-medium">4.8</span>
              </div>
              <p className="text-xs font-bold text-blue-700 mt-0.5">₹1,19,900</p>
            </div>
          </div>
          <Link to="/explore">
            <button className="w-full h-8 mt-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors">
              Compare Options
            </button>
          </Link>
        </div>
      </div>

      {/* Input bar */}
      <div className="px-3 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
        <input
          readOnly
          value=""
          placeholder="Describe what you need..."
          className="h-8 flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 outline-none text-slate-500 placeholder:text-slate-400"
        />
        <Link to="/assistant">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors shrink-0">
            <Send size={12} className="text-white" />
          </div>
        </Link>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-inter text-[#0F172A]">
      <Navbar />

      {/* ── HERO ── */}
      <section className="pt-28 pb-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left 7 cols */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
                Intelligent Shopping Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0F172A] tracking-tight leading-tight mb-6">
                Your next purchase starts with a{' '}
                <span className="text-blue-600">better decision.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
                Meet your AI shopping companion. Discover suitable products, compare technical specifications and prices, and shop with confidence.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link to="/assistant">
                  <Button variant="primary" size="lg">
                    Start Shopping <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button variant="outline" size="lg">
                    Explore Products
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                {[
                  'No sponsored listings',
                  'Transparent pricing',
                  'You approve every purchase'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 cols */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-3">
              How PayNex Works
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              A structured, three-step approach to deliberate shopping decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.num}
                  className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                      Step {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <Icon size={20} className="text-slate-700" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-3">
              Core Capabilities
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              Engineered to assist you from discovery through final checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-blue-200 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── WHY PAYNEX (HONEST ENGINE BREAKDOWN) ── */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-4">
                Designed for Informed Decisions
              </h2>
              <p className="text-slate-500 text-sm sm:text-base mb-8 leading-relaxed">
                Traditional marketplaces prioritize sponsored items and ad impressions. PayNex focuses solely on matching verified specifications to your requirements.
              </p>

              <div className="space-y-4">
                {WHY_POINTS.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                  <div className="flex items-center gap-2">
                    <Sliders size={18} className="text-blue-600" />
                    <span className="text-sm font-bold text-slate-800">Decision Criteria</span>
                  </div>
                  <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                    Objective Evaluation
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Budget Ceiling', desc: 'Strict filtering prevents overspending', status: 'Enforced' },
                    { label: 'Hardware Specs', desc: 'Real technical benchmarking across products', status: 'Verified' },
                    { label: 'Price-to-Value', desc: 'Normalized price comparison without markups', status: 'Calculated' },
                    { label: 'User Authorization', desc: 'Zero automatic charging without consent', status: 'Required' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.label}</p>
                        <p className="text-[11px] text-slate-500">{item.desc}</p>
                      </div>
                      <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAYMENT CONTROL NOTICE ── */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#172554] text-white rounded-2xl p-8 sm:p-12">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-2 block">
                User-Controlled Payments
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
                You always approve every purchase.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                PayNex is a product evaluation and discovery tool, not an auto-billing platform. You inspect your cart, review order details, and authorize the final transaction explicitly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                  <p className="text-xs font-semibold text-white mb-1">Itemized Review</p>
                  <p className="text-xs text-slate-400">Review specifications and totals before checkout.</p>
                </div>
                <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                  <p className="text-xs font-semibold text-white mb-1">Payment Gateways</p>
                  <p className="text-xs text-slate-400">Secure third-party PayPal processing (Phase 5).</p>
                </div>
                <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                  <p className="text-xs font-semibold text-white mb-1">Zero Stored Credentials</p>
                  <p className="text-xs text-slate-400">No payment credentials stored in frontend storage.</p>
                </div>
              </div>

              <Link to="/explore">
                <Button variant="white" size="md">
                  Explore Catalog <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CALL TO ACTION ── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-3">
            Find Better. Buy Smarter.
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
            Start discovering products matched to your actual requirements and budget.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/assistant">
              <Button variant="primary" size="lg">
                Try AI Assistant
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
