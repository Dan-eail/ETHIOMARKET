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