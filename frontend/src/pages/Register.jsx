import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, Check, ArrowRight, Loader2 } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

const WHY = [
  'Discover products with natural language',
  'Compare specs and prices side-by-side',
  'Pay securely — you always approve first',
]

function InputField({ label, value, onChange, error, type = 'text', placeholder, right }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className={[
            'h-10 w-full pl-3.5 pr-4 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 transition bg-white',
            right ? 'pr-10' : '',
            error ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-blue-500',
          ].join(' ')}
        />
        {right}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function PwToggle({ show, setShow }) {
  return (
    <button
      type="button"
      onClick={() => setShow(s => !s)}
      className="w-7 h-7 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rounded-md"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', terms: false,
  })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw]  = useState(false)
  const [showCp, setShowCp]  = useState(false)
  const [notice, setNotice]  = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (form.name.trim().length < 2)                          e.name     = 'Full name must be at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))      e.email    = 'Enter a valid email address.'
    if (form.password.length < 8)                             e.password = 'Password must be at least 8 characters.'
    if (form.confirm !== form.password)                       e.confirm  = 'Passwords do not match.'
    if (!form.terms)                                          e.terms    = 'You must accept the terms to continue.'
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
      await register({ full_name: form.name, email: form.email, password: form.password })
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Account registration failed. Please try again.'
      setNotice(msg)
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) =>
    setForm(f => ({ ...f, [field]: field === 'terms' ? e.target.checked : e.target.value }))

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
          <h2 className="text-3xl font-bold text-white mb-4">Start shopping smarter today.</h2>
          <p className="text-blue-200 text-sm mb-8 leading-relaxed">
            Create your PayNex account and unlock AI-powered shopping decisions.
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
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-[#172554]">PayNex</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-sm text-slate-500 mb-7">Start shopping smarter with PayNex</p>

          {notice && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Full Name"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              placeholder="Jane Doe"
            />
            <InputField
              label="Email address"
              type="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              placeholder="you@example.com"
            />
            <InputField
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              placeholder="Min. 8 characters"
              right={<PwToggle show={showPw} setShow={setShowPw} />}
            />
            <InputField
              label="Confirm Password"
              type={showCp ? 'text' : 'password'}
              value={form.confirm}
              onChange={set('confirm')}
              error={errors.confirm}
              placeholder="Repeat your password"
              right={<PwToggle show={showCp} setShow={setShowCp} />}
            />

            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={form.terms} onChange={set('terms')}
                  className="accent-blue-600 w-4 h-4 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-600">
                  I agree to the{' '}
                  <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span>
                  {' '}and{' '}
                  <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
                </span>
              </label>
              {errors.terms && <p className="text-xs text-red-500 mt-1">{errors.terms}</p>}
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={16} />
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
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-4">
            This is a demo interface. No real authentication is implemented.
          </p>
        </div>
      </div>
    </div>
  )
}
