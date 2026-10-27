import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import { ProductCard } from '../components/ui/ProductCard'
import { NegotiateModal } from '../components/ui/NegotiateModal'
import { DirectOrderModal } from '../components/ui/DirectOrderModal'
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  X,
  PackageOpen
} from 'lucide-react'

export const MarketplacePage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 })

  // Filters state from URL or defaults
  const currentCategory = searchParams.get('category') || ''
  const currentSearch = searchParams.get('search') || ''
  const currentRegion = searchParams.get('region') || 'all'
  const currentUnit = searchParams.get('unit') || 'all'
  const currentSort = searchParams.get('sort') || 'newest'
  const currentOrganic = searchParams.get('organic') === 'true'

  const [searchInput, setSearchInput] = useState(currentSearch)
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')

  // Market Prices Intelligence
  const [marketPrices, setMarketPrices] = useState([])

  // Smart Supplier Matching Modal
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const [matchCropQuery, setMatchCropQuery] = useState('')
  const [matchQty, setMatchQty] = useState('10')
  const [matchRegion, setMatchRegion] = useState('')
  const [matchOrganic, setMatchOrganic] = useState(false)
  const [matchResults, setMatchResults] = useState([])
  const [matchingLoading, setMatchingLoading] = useState(false)

  // Modals
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [negotiateOpen, setNegotiateOpen] = useState(false)
  const [directOrderOpen, setDirectOrderOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Load categories and market price benchmarks once
  useEffect(() => {
    api.getCategories().then(res => setCategories(res.categories || [])).catch(console.error)
    api.getMarketPrices().then(res => setMarketPrices(res.prices || [])).catch(console.error)
  }, [])

  const handleMatchSubmit = async (e) => {
    e.preventDefault()
    if (!matchCropQuery.trim()) return
    setMatchingLoading(true)
    try {
      const res = await api.matchSuppliers({
        cropQuery: matchCropQuery.trim(),
        requestedQty: parseFloat(matchQty),
        region: matchRegion || undefined,
        isOrganic: matchOrganic
      })
      setMatchResults(res.matches || [])
    } catch (err) {
      alert(err.message || 'Matching failed')
    } finally {
      setMatchingLoading(false)
    }
  }

  // Fetch products whenever params change
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setLoading(true)
      try {
        const queryParams = {
          search: currentSearch,
          category: currentCategory,
          region: currentRegion !== 'all' ? currentRegion : undefined,
          unit: currentUnit !== 'all' ? currentUnit : undefined,
          sort: currentSort,
          isOrganic: currentOrganic ? 'true' : undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
        }
        const res = await api.getProducts(queryParams)
        setProducts(res.products || [])
        setMeta(res.meta || { total: 0, page: 1, totalPages: 1 })
      } catch (err) {
        console.error('Failed to load marketplace products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFilteredProducts()
  }, [searchParams])

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParam('search', searchInput.trim())
  }

  const clearAllFilters = () => {
    setSearchInput('')
    setMinPrice('')
    setMaxPrice('')
    setSearchParams(new URLSearchParams())
  }

  const triggerToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ethio-900 text-white px-5 py-3 rounded-2xl shadow-float flex items-center gap-3 border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Regional Commodity Price Intelligence Strip (ECX & Ministry of Agriculture) */}
      {marketPrices.length > 0 && (
        <div className="bg-sand-subtle border border-sand-border rounded-2xl p-3.5 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-[11px] uppercase tracking-wider text-ethio-800 font-extrabold">Regional Price Intelligence (ECX & Ministry of Agriculture Spot Benchmarks)</span>
            </div>
            <span className="text-[10px] text-slate-400">Updated Daily · Verified Spot Data</span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none text-xs pb-1">
            {marketPrices.map((p) => (
              <div key={p.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shrink-0 shadow-xs">
                <span className="font-bold text-slate-900">{p.cropName}</span>
                <span className="text-[11px] text-slate-400">({p.marketName})</span>
                <strong className="text-ethio-950 font-extrabold">ETB {p.pricePerUnit.toLocaleString()}/{p.unit.toLowerCase()}</strong>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.trendPercentage >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {p.trendPercentage >= 0 ? `+${p.trendPercentage}%` : `${p.trendPercentage}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-sand-border">
        <div>
          <span className="text-xs font-extrabold text-ethio-700 uppercase tracking-wider block mb-1">
            Produce Marketplace
          </span>
          <h1 className="text-3xl font-extrabold text-ethio-950">
            Source Agricultural Produce
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {meta.total} available farm listings across Ethiopian regions
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Smart Match Button */}
          <button
            onClick={() => { setMatchModalOpen(true); setMatchResults([]); }}
            className="px-4 py-2.5 rounded-2xl bg-ethio-800 hover:bg-ethio-900 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Smart Match Farmers</span>
          </button>

          {/* Search input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search onions, teff, coffee..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </form>
        </div>
      </div>

      {/* Category Pills Bar (Matching Inspiration image 0) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => updateParam('category', '')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
            !currentCategory
              ? 'bg-ethio-700 text-white'
              : 'bg-white text-slate-700 border border-sand-border hover:bg-slate-50'
          }`}
        >
          All Produce
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateParam('category', cat.slug)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
              currentCategory === cat.slug
                ? 'bg-ethio-700 text-white'
                : 'bg-white text-slate-700 border border-sand-border hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid: Filters Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Filter Sidebar */}
        <div className="space-y-6 bg-white p-5 rounded-3xl border border-sand-border h-fit shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <SlidersHorizontal className="w-4 h-4 text-ethio-700" />
              <span>Filters & Sorting</span>
            </div>
            {(currentCategory || currentSearch || currentRegion !== 'all' || currentOrganic) && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-red-600 hover:text-red-700"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Region</label>
            <select
              value={currentRegion}
              onChange={(e) => updateParam('region', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-sand-border text-xs bg-sand-bg focus:ring-2 focus:ring-ethio-600 focus:outline-none"
            >
              <option value="all">All Ethiopian Regions</option>
              <option value="Oromia">Oromia (Meki, Adama, Bishoftu)</option>
              <option value="Amhara">Amhara (Bahir Dar, Gondar)</option>
              <option value="Sidama">Sidama (Hawassa)</option>
              <option value="SNNPR / Sidama">SNNPR & Guji</option>
              <option value="Addis Ababa">Addis Ababa</option>
              <option value="Tigray">Tigray</option>
              <option value="Dire Dawa">Dire Dawa & Harar</option>
            </select>
          </div>

          {/* Unit Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Measurement Unit</label>
            <select
              value={currentUnit}
              onChange={(e) => updateParam('unit', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-sand-border text-xs bg-sand-bg focus:ring-2 focus:ring-ethio-600 focus:outline-none"
            >
              <option value="all">Any Unit</option>
              <option value="QUINTAL">Quintal (100 kg)</option>
              <option value="KG">Kilogram (kg)</option>
              <option value="CRATE">Crate (20-25 kg)</option>
              <option value="SACK">Sack (Jute bag)</option>
              <option value="TON">Metric Ton</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Sort Results</label>
            <select
              value={currentSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-sand-border text-xs bg-sand-bg focus:ring-2 focus:ring-ethio-600 focus:outline-none"
            >
              <option value="newest">Newest Listings</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Inquired</option>
            </select>
          </div>

          {/* Organic Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={currentOrganic}
                onChange={(e) => updateParam('organic', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded text-ethio-700 focus:ring-ethio-600"
              />
              <span className="text-xs font-bold text-slate-700">100% Certified Organic</span>
            </label>
          </div>

        </div>

        {/* Right Products Grid */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-3xl h-96 animate-pulse border border-sand-border"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sand-border p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <PackageOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No produce matching your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try selecting "All Ethiopian Regions" or resetting your search keywords to view other fresh farm listings.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 rounded-full bg-ethio-700 text-white text-xs font-bold shadow-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onNegotiate={(p) => {
                    setSelectedProduct(p)
                    setNegotiateOpen(true)
                  }}
                  onBuyNow={(p) => {
                    setSelectedProduct(p)
                    setDirectOrderOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      <NegotiateModal
        product={selectedProduct}
        isOpen={negotiateOpen}
        onClose={() => setNegotiateOpen(false)}
        onSuccess={(quote) => {
          triggerToast(`Quotation #${quote.quoteNumber} submitted successfully!`)
        }}
      />

      <DirectOrderModal
        product={selectedProduct}
        isOpen={directOrderOpen}
        onClose={() => setDirectOrderOpen(false)}
        onSuccess={(order) => {
          triggerToast(`Order #${order.orderNumber} confirmed! Stock reserved.`)
        }}
      />

      {/* SMART SUPPLIER MATCHING MODAL */}
      {matchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-float border border-sand-border my-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Smart Supplier Match</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Automated rule-based matching based on available harvest stock, regional proximity, verified cooperative licenses, and organic purity.
                </p>
              </div>
              <button
                onClick={() => setMatchModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matching Criteria Input Form */}
            <form onSubmit={handleMatchSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Produce / Crop Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Teff, Onion, Garlic, Coffee"
                  value={matchCropQuery}
                  onChange={(e) => setMatchCropQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 20"
                  value={matchQty}
                  onChange={(e) => setMatchQty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Region (Optional)</label>
                <select
                  value={matchRegion}
                  onChange={(e) => setMatchRegion(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
                >
                  <option value="">Any Ethiopian Region</option>
                  <option value="Oromia">Oromia</option>
                  <option value="Amhara">Amhara</option>
                  <option value="Sidama">Sidama</option>
                  <option value="Southern">Southern</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="modalOrganic"
                  checked={matchOrganic}
                  onChange={(e) => setMatchOrganic(e.target.checked)}
                  className="w-4 h-4 rounded text-ethio-700 focus:ring-ethio-600"
                />
                <label htmlFor="modalOrganic" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Require 100% Certified Organic Harvest
                </label>
              </div>

              <div className="col-span-1 sm:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={matchingLoading}
                  className="px-6 py-2.5 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {matchingLoading ? 'Analyzing Platform Suppliers...' : 'Find Matches'}
                </button>
              </div>
            </form>

            {/* Matched Suppliers Results */}
            {matchResults.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Top Ranked Matches ({matchResults.length} Found)
                </h4>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {matchResults.map((match, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-sand-border bg-sand-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-black">
                            {match.matchScore}% Match
                          </span>
                          <h5 className="text-sm font-bold text-slate-900">{match.product.title}</h5>
                        </div>

                        <p className="text-xs text-slate-500">
                          Supplier: <strong>{match.product.seller?.farmerProfile?.farmName || match.product.seller?.name}</strong> · Rate: <strong>ETB {match.product.pricePerUnit?.toLocaleString()}/{match.product.unit.toLowerCase()}</strong>
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {match.matchReasons?.map((reason, rIdx) => (
                            <span key={rIdx} className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setMatchModalOpen(false)
                            setSelectedProduct(match.product)
                            setNegotiateOpen(true)
                          }}
                          className="px-3 py-1.5 rounded-xl border border-sand-border bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Negotiate
                        </button>
                        <button
                          onClick={() => {
                            setMatchModalOpen(false)
                            setSelectedProduct(match.product)
                            setDirectOrderOpen(true)
                          }}
                          className="px-4 py-1.5 rounded-xl bg-ethio-700 text-white text-xs font-bold hover:bg-ethio-800"
                        >
                          Order Direct
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
