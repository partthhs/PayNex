import { useState } from 'react'
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { CATEGORIES, SORT_OPTIONS } from '../../constants'

function Section({ id, title, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-slate-200 pb-4 mb-4">
      <button
        type="button"
        className="flex items-center justify-between w-full text-sm font-semibold text-slate-700 mb-3"
        onClick={() => onToggle(id)}
      >
        {title}
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isOpen && children}
    </div>
  )
}

export default function FilterPanel({
  selectedCategory, onCategoryChange,
  priceRange, onPriceRangeChange,
  selectedRating, onRatingChange,
  sortBy, onSortChange,
  brands = [], selectedBrands = [], onBrandChange,
  onReset,
}) {
  const [openSections, setOpenSections] = useState({ cat: true, price: true, rating: true, brand: true, sort: true })

  const toggle = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <SlidersHorizontal size={16} className="text-blue-600" />
          Filters
        </div>
        <button onClick={onReset} className="text-xs text-blue-600 hover:underline font-medium">
          Reset All
        </button>
      </div>

      {/* Sort */}
      <Section id="sort" title="Sort By" isOpen={openSections.sort} onToggle={toggle}>
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value)}
          className="h-9 w-full text-xs sm:text-sm border border-slate-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Section>

      {/* Category */}
      <Section id="cat" title="Category" isOpen={openSections.cat} onToggle={toggle}>
        <div className="space-y-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={[
                'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors',
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Price */}
      <Section id="price" title="Price Range" isOpen={openSections.price} onToggle={toggle}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Min (₹)</label>
              <input
                type="number"
                value={priceRange[0]}
                min={0}
                max={priceRange[1]}
                step={500}
                onChange={e => onPriceRangeChange([+e.target.value, priceRange[1]])}
                className="h-9 w-full text-xs sm:text-sm border border-slate-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Max (₹)</label>
              <input
                type="number"
                value={priceRange[1]}
                min={priceRange[0]}
                max={200000}
                step={500}
                onChange={e => onPriceRangeChange([priceRange[0], +e.target.value])}
                className="h-9 w-full text-xs sm:text-sm border border-slate-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center">
            ₹{priceRange[0].toLocaleString('en-IN')} – ₹{priceRange[1].toLocaleString('en-IN')}
          </p>
        </div>
      </Section>

      {/* Rating */}
      <Section id="rating" title="Min Rating" isOpen={openSections.rating} onToggle={toggle}>
        <div className="flex gap-2 flex-wrap">
          {[0, 3, 4, 4.5].map(r => (
            <button
              key={r}
              onClick={() => onRatingChange(r)}
              className={[
                'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
                selectedRating === r
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-slate-200 text-slate-600 hover:border-blue-300',
              ].join(' ')}
            >
              {r === 0 ? 'Any' : `${r}★+`}
            </button>
          ))}
        </div>
      </Section>

      {/* Brand */}
      {brands.length > 0 && (
        <Section id="brand" title="Brand" isOpen={openSections.brand} onToggle={toggle}>
          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {brands.map(b => (
              <label key={b} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(b)}
                  onChange={() => onBrandChange(b)}
                  className="accent-blue-600 w-4 h-4"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900">{b}</span>
              </label>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
