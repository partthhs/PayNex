import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, LayoutDashboard } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <p className="text-[8rem] font-black text-slate-100 leading-none select-none">404</p>
        <h1 className="text-2xl font-bold text-slate-800 -mt-4 mb-3">Page not found</h1>
        <p className="text-slate-500 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button variant="primary" size="md">
              <Home size={16} /> Go Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="md">
              <LayoutDashboard size={16} /> Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
