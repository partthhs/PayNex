import { useState, useEffect } from 'react'
import { Camera, CheckCircle } from 'lucide-react'
import { CATEGORIES } from '../constants'
import { useAuth } from '../context/AuthContext'
import { dashboardService } from '../services/aiService'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'

function Notice({ message }) {
  if (!message) return null
  return <p className="text-xs text-blue-600 mt-2 font-medium flex items-center gap-1"><CheckCircle size={13} /> {message}</p>
}

function ProfileField({ label, value, onChange, type = 'text', disabled = false }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value || ''}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className={`h-10 w-full px-3.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors ${
          disabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''
        }`}
      />
    </div>
  )
}

export default function Profile() {
  const { user, isAuthenticated } = useAuth()
  const [personal, setPersonal] = useState({
    name: user?.full_name || 'Guest User',
    email: user?.email || 'guest@paynex.demo',
    phone: '',
    dob: '',
  })
  const [prefCats, setPrefCats] = useState(['laptops', 'smartphones'])
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [notices, setNotices] = useState({})
  const [toggles, setToggles] = useState({ emailNotif: true, priceAlert: true, compareUpdates: false })

  useEffect(() => {
    async function fetchProfile() {
      if (isAuthenticated) {
        try {
          const p = await dashboardService.getProfile()
          setPersonal({
            name: p.full_name || user?.full_name || '',
            email: p.email || user?.email || '',
            phone: p.phone || '',
            dob: p.date_of_birth || '',
          })
          if (p.preferred_categories?.length) setPrefCats(p.preferred_categories)
          if (p.budget_min) setBudgetMin(String(p.budget_min))
          if (p.budget_max) setBudgetMax(String(p.budget_max))
          setToggles({
            emailNotif: p.email_notifications ?? true,
            priceAlert: p.price_alerts ?? true,
            compareUpdates: p.compare_updates ?? false,
          })
        } catch (err) {
          console.warn('Could not fetch remote profile:', err)
        }
      }
    }
    fetchProfile()
  }, [isAuthenticated, user])

  const setNotice = (key, msg) => {
    setNotices(n => ({ ...n, [key]: msg }))
    setTimeout(() => setNotices(n => ({ ...n, [key]: '' })), 4000)
  }

  const toggleCat = (id) => setPrefCats(prev =>
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
  )

  const handleSavePersonal = async () => {
    if (!isAuthenticated) {
      setNotice('personal', 'Please sign in to persist profile updates to PostgreSQL.')
      return
    }
    try {
      await dashboardService.updateProfile({
        full_name: personal.name,
        phone: personal.phone,
        date_of_birth: personal.dob,
      })
      setNotice('personal', 'Personal information saved to PostgreSQL.')
    } catch {
      setNotice('personal', 'Failed to update personal information.')
    }
  }

  const handleSavePreferences = async () => {
    if (!isAuthenticated) {
      setNotice('prefs', 'Please sign in to persist preferences to PostgreSQL.')
      return
    }
    try {
      await dashboardService.updateProfile({
        preferred_categories: prefCats,
        budget_min: budgetMin ? parseFloat(budgetMin) : null,
        budget_max: budgetMax ? parseFloat(budgetMax) : null,
      })
      setNotice('prefs', 'Preferences saved to PostgreSQL.')
    } catch {
      setNotice('prefs', 'Failed to update preferences.')
    }
  }

  const handleSaveSettings = async () => {
    if (!isAuthenticated) {
      setNotice('settings', 'Please sign in to persist account settings.')
      return
    }
    try {
      await dashboardService.updateProfile({
        email_notifications: toggles.emailNotif,
        price_alerts: toggles.priceAlert,
        compare_updates: toggles.compareUpdates,
      })
      setNotice('settings', 'Notification preferences saved.')
    } catch {
      setNotice('settings', 'Failed to update settings.')
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your account settings and preferences" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Avatar card */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-white">
                {(personal.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{personal.name}</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-2 truncate max-w-full">{personal.email}</p>
            <Badge variant={isAuthenticated ? 'success' : 'primary'} className="mb-4">
              {isAuthenticated ? 'Verified Account' : 'Demo Profile'}
            </Badge>
            <Button variant="outline" size="sm" fullWidth>
              <Camera size={14} /> Edit Avatar
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-5">
          {/* Personal info */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <ProfileField label="Full Name"     value={personal.name}  onChange={v => setPersonal(p => ({ ...p, name: v  }))} />
              <ProfileField label="Email"         value={personal.email} onChange={v => setPersonal(p => ({ ...p, email: v }))} type="email" disabled />
              <ProfileField label="Phone"         value={personal.phone} onChange={v => setPersonal(p => ({ ...p, phone: v }))} placeholder="+91 00000 00000" />
              <ProfileField label="Date of Birth" value={personal.dob}   onChange={v => setPersonal(p => ({ ...p, dob: v   }))} type="date" />
            </div>
            <Button variant="primary" size="sm" onClick={handleSavePersonal}>
              Save Changes
            </Button>
            <Notice message={notices.personal} />
          </div>

          {/* Shopping preferences */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Shopping Preferences</h2>
            <p className="text-xs text-slate-500 mb-3 font-medium">Preferred product categories</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat.id)}
                  className={[
                    'px-3 py-1 text-xs rounded-lg border font-medium transition-colors',
                    prefCats.includes(cat.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white',
                  ].join(' ')}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mb-2 font-medium">Target budget range (₹)</p>
            <div className="flex gap-3 mb-4">
              <input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="Minimum" className="h-10 flex-1 px-3.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="Maximum" className="h-10 flex-1 px-3.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <Button variant="primary" size="sm" onClick={handleSavePreferences}>
              Save Preferences
            </Button>
            <Notice message={notices.prefs} />
          </div>

          {/* Account settings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Account Settings</h2>
            <p className="text-xs font-semibold text-slate-700 mb-3">Notification Preferences</p>
            <div className="space-y-3 mb-5">
              {[
                { key: 'emailNotif',    label: 'Order confirmation emails' },
                { key: 'priceAlert',    label: 'Price drop notifications'  },
                { key: 'compareUpdates',label: 'Comparison updates'        },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setToggles(t => ({ ...t, [key]: !t[key] }))}
                    className={[
                      'w-9 h-5 rounded-full relative transition-colors cursor-pointer',
                      toggles[key] ? 'bg-blue-600' : 'bg-slate-200',
                    ].join(' ')}
                  >
                    <div className={[
                      'w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform shadow',
                      toggles[key] ? 'translate-x-4.5' : 'translate-x-0.5',
                    ].join(' ')} />
                  </div>
                  <span className="text-xs text-slate-700">{label}</span>
                </label>
              ))}
            </div>
            <Button variant="primary" size="sm" onClick={handleSaveSettings}>
              Save Notification Settings
            </Button>
            <Notice message={notices.settings} />
          </div>
        </div>
      </div>
    </div>
  )
}
