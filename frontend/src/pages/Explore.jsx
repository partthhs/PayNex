import { useState, useMemo } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { PRODUCTS, getUniqueBrands } from '../data/products'
import { CATEGORIES } from '../constants'
import SearchBar from '../components/ui/SearchBar'
import FilterPanel from '../components/products/FilterPanel'
import ProductCard from '../components/products/ProductCard'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'

export default function Explore() {
  const [query,          setQuery]          = useState('')
  const [category,       setCategory]       = useState('all')
  const [priceRange,     setPriceRange]     = useState([0, 200000])
  const [selectedRating, setSelectedRating] = useState(0)
  const [sortBy,         setSortBy]         = useState('relevance')
  const [selectedBrands, setSelectedBrands] = useState([])
  const [filtersOpen,    setFiltersOpen]    = useState(false)

  const brands = getUniqueBrands()

  const toggleBrand = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const reset = () => {
    setQuery(''); setCategory('all'); setPriceRange([0, 200000])
    setSelectedRating(0); setSortBy('relevance'); setSelectedBrands([])
  }

  const filtered = useMemo(() => {
    let list = [...PRODUCTS]

    if (category !== 'all') list = list.filter(p => p.category === category)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q)
      )
    }
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    if (selectedRating > 0) list = list.filter(p => p.rating >= selectedRating)
    if (selectedBrands.length > 0) list = list.filter(p => selectedBrands.includes(p.brand))

    switch (sortBy) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break
      case 'price-desc': list.sort((a, b) => b.price - a.price); break
      case 'rating':     list.sort((a, b) => b.rating - a.rating); break
      default: break
    }
    return list
  }, [query, category, priceRange, selectedRating, sortBy, selectedBrands])

  const catLabel = CATEGORIES.find(c => c.id === category)?.label || 'All Products'

  return (
    <div>
      <PageHeader
        title="Explore Products"
        description="Discover products across all categories"
        actions={
          <Button variant="outline" size="sm" onClick={() => setFiltersOpen(o => !o)} className="lg:hidden">
            <SlidersHorizontal size={15} /> Filters
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-5">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search products, brands, categories..."
          onSearch={() => {}}
        />
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters (desktop) */}
        <div className="hidden lg:block w-56 shrink-0">
          <FilterPanel
            selectedCategory={category} onCategoryChange={setCategory}
            priceRange={priceRange}      onPriceRangeChange={setPriceRange}
            selectedRating={selectedRating} onRatingChange={setSelectedRating}
            sortBy={sortBy}              onSortChange={setSortBy}
            brands={brands}              selectedBrands={selectedBrands} onBrandChange={toggleBrand}
            onReset={reset}
          />
        </div>

        {/* Mobile filter overlay */}
        {filtersOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
            <div className="relative ml-auto w-72 h-full bg-slate-50 overflow-y-auto p-4 z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-slate-800">Filters</span>
                <button onClick={() => setFiltersOpen(false)} className="p-1 text-slate-500 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>
              <FilterPanel
                selectedCategory={category} onCategoryChange={(c) => { setCategory(c); setFiltersOpen(false) }}
                priceRange={priceRange}      onPriceRangeChange={setPriceRange}
                selectedRating={selectedRating} onRatingChange={setSelectedRating}
                sortBy={sortBy}              onSortChange={setSortBy}
                brands={brands}              selectedBrands={selectedBrands} onBrandChange={toggleBrand}
                onReset={reset}
              />
            </div>
          </div>
        )}

        {/* Products */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              Showing <strong className="text-slate-800">{filtered.length}</strong> product{filtered.length !== 1 ? 's' : ''}
              {category !== 'all' && <> in <strong className="text-slate-800">{catLabel}</strong></>}
            </p>
            {(query || category !== 'all' || selectedBrands.length > 0) && (
              <button onClick={reset} className="text-xs text-blue-600 hover:underline font-medium">
                Clear filters
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<SlidersHorizontal size={28} />}
              title="No products found"
              description="Try adjusting your filters or search query."
              action={<Button variant="outline" size="sm" onClick={reset}>Reset Filters</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-5">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
