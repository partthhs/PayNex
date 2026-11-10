import { useState } from 'react'
import { Camera, Info } from 'lucide-react'
import { CATEGORIES } from '../constants'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'

const DEMO_USER = { name: 'Demo User', email: 'user@paynex.demo', phone: '+91 98765 43210', dob: '1995-01-01' }

function Notice({ message }) {
  if (!message) return null
  return <p className="text-xs text-blue-600 mt-2 font-medium">{message}</p>
}

function ProfileField({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-10 w-full px-3.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors"
      />
    </div>
  )
}

export default function Profile() {
  const [personal, setPersonal] = useState(DEMO_USER)
  const [prefCats, setPrefCats] = useState(['laptops', 'smartphones'])
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [notices, setNotices] = useState({})
  const [toggles, setToggles] = useState({ emailNotif: true, priceAlert: true, compareUpdates: false })

  const setNotice = (key, msg) => {
    setNotices(n => ({ ...n, [key]: msg }))
    setTimeout(() => setNotices(n => ({ ...n, [key]: '' })), 4000)
  }

  const toggleCat = (id) => setPrefCats(prev =>
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
  )

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your account settings and preferences" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Avatar card */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-white">U</span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{personal.name}</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-2">{personal.email}</p>
            <Badge variant="primary" className="mb-4">Session Account</Badge>
            <p className="text-[11px] text-slate-400 mb-4">Demo Profile</p>
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
              <ProfileField label="Email"         value={personal.email} onChange={v => setPersonal(p => ({ ...p, email: v }))} type="email" />
              <ProfileField label="Phone"         value={personal.phone} onChange={v => setPersonal(p => ({ ...p, phone: v }))} />
              <ProfileField label="Date of Birth" value={personal.dob}   onChange={v => setPersonal(p => ({ ...p, dob: v   }))} type="date" />
            </div>
            <Button variant="primary" size="sm" onClick={() => setNotice('personal', 'Profile updates will sync after backend integration (Phase 3).')}>
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
            <Button variant="primary" size="sm" onClick={() => setNotice('prefs', 'Profile updates will sync after backend integration (Phase 3).')}>
              Save Preferences
            </Button>
            <Notice message={notices.prefs} />
          </div>

          {/* Account settings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Account Settings</h2>

            {/* Notifications */}
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
                  <span className="text-xs text-slate-700 font-medium">{label}</span>
                </label>
              ))}
            </div>

            {/* Change password */}
            <p className="text-xs font-semibold text-slate-700 mb-3">Security & Password</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {['Current Password', 'New Password', 'Confirm New'].map(ph => (
                <input key={ph} type="password" placeholder={ph}
                  className="h-10 px-3.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setNotice('pw', 'Profile updates will sync after backend integration (Phase 3).')}>
              Update Password
            </Button>
            <Notice message={notices.pw} />

            {/* Danger zone */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Danger Zone</p>
              <Button variant="danger" size="sm" onClick={() => setNotice('delete', 'Account management will be available after backend integration.')}>
                Delete Account
              </Button>
              <Notice message={notices.delete} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex items-start gap-2.5">
            <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">
              Profile configurations operate within session storage during Phase 2.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
