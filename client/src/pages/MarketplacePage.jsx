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