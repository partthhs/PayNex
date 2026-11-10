import { Link } from 'react-router-dom'
import { Zap, Globe, Mail, Share2 } from 'lucide-react'

const COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Explore Products', to: '/explore'   },
      { label: 'AI Assistant',     to: '/assistant'  },
      { label: 'Compare',          to: '/compare'    },
      { label: 'Shopping Cart',    to: '/cart'       },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',           to: '/' },
      { label: 'Privacy Policy',  to: '/' },
      { label: 'Terms of Service',to: '/' },
      { label: 'Contact',         to: '/' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#172554] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold">PayNex</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Find Better. Buy Smarter.
            </p>
            <p className="text-slate-500 text-xs leading-relaxed">
              AI-powered shopping decisions. You always approve every purchase.
            </p>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">{col.heading}</h4>
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-slate-400 hover:text-white text-sm transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Connect */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Connect</h4>
            <div className="flex gap-3">
              {[Globe, Mail, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Icon size={16} className="text-slate-300" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© 2025 PayNex. All rights reserved.</span>
          <span>Built for demonstration purposes.</span>
        </div>
      </div>
    </footer>
  )
}
