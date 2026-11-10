import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, Check, ArrowRight, Loader2 } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

const WHY = [
  'AI-powered product discovery',
  'Smart price comparison engine',
  'You approve every purchase',
]

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form,   setForm]   = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setNotice('')
    setLoading(true)

    try {
      await login({ email: form.email, password: form.password })
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.'
      setNotice(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-[#172554] p-12">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">PayNex</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-4">Find Better.<br />Buy Smarter.</h2>
          <p className="text-blue-200 text-sm mb-8 leading-relaxed">
            Your AI-powered shopping companion helps you discover, compare and purchase the right products.
          </p>
          <ul className="space-y-3">
            {WHY.map(w => (
              <li key={w} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-sky-300" />
                </span>
                <span className="text-sm text-blue-100">{w}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-blue-300">© 2025 PayNex. Demo platform.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-[#172554]">PayNex</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-7">Sign in to your PayNex account</p>

          {notice && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={form.email}
                placeholder="you@example.com"
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={[
                  'h-10 w-full px-3.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 transition bg-white',
                  errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-blue-500',
                ].join(' ')}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  placeholder="Min. 6 characters"
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={[
                    'h-10 w-full pl-3.5 pr-10 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 transition bg-white',
                    errors.password ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-blue-500',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="w-7 h-7 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rounded-md"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.remember}
                  onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                  className="accent-blue-600 w-4 h-4"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:underline">Forgot password?</button>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Button variant="outline" size="lg" fullWidth onClick={() => navigate('/dashboard')}>
            Continue as Guest <span className="text-xs text-slate-400 ml-1">(Demo access)</span>
          </Button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">Create one</Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-4">
            This is a demo interface. No real authentication is implemented.
          </p>
        </div>
      </div>
    </div>
  )
}
