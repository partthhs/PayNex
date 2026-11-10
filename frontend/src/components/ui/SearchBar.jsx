import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = 'Search...', onSearch }) {
  const handleKey = (e) => {
    if (e.key === 'Enter' && onSearch) onSearch(value)
  }

  return (
    <div className="relative w-full">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className="h-10 w-full pl-10 pr-10 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          text-slate-900 placeholder:text-slate-400 transition"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="w-7 h-7 flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rounded-md"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
