import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api'
import { ProductCard } from '../components/ui/ProductCard'
import { NegotiateModal } from '../components/ui/NegotiateModal'
import { DirectOrderModal } from '../components/ui/DirectOrderModal'
import {
  MapPin,
  ShieldCheck,
  Calendar,
  Scale,
  Sparkles,
  Truck,
  ArrowLeft,
  ShoppingBag,
  Award,
  CheckCircle2,
  Phone,
  Building
} from 'lucide-react'

export const ProductDetailPage = () => {
  const { id } = useParams()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImg, setSelectedImg] = useState('')

  // Modals
  const [negotiateOpen, setNegotiateOpen] = useState(false)
  const [directOrderOpen, setDirectOrderOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const res = await api.getProductById(id)
        setProduct(res.product)
        setRelated(res.related || [])
        setSelectedImg(res.product.images?.[0]?.url || '')
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-10 bg-slate-200 rounded-xl"></div>
            <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
            <div className="h-24 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Produce Listing Not Found</h2>
        <Link to="/marketplace" className="text-xs font-bold text-ethio-700 hover:underline">
          Return to Marketplace
        </Link>
      </div>
    )
  }

  const isVerified = product.seller?.isVerified || product.seller?.farmerProfile?.verifiedBadge

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ethio-900 text-white px-5 py-3 rounded-2xl shadow-float flex items-center gap-3 border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Back button */}
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-ethio-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Produce Marketplace</span>
      </Link>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-sand-subtle border border-sand-border shadow-card relative">
            <img
              src={selectedImg || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80'}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {product.isOrganic && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Certified Organic</span>
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImg(img.url)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedImg === img.url ? 'border-ethio-700 shadow-md' : 'border-sand-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Specifications & Purchasing Widget (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Category & Location */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
              {product.category?.name}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-sand-subtle px-3 py-1 rounded-full border border-sand-border">
              <MapPin className="w-3.5 h-3.5 text-ethio-700" />
              <span>{product.city}, {product.region}</span>
            </div>
            {product.grade && (
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-ethio-800 text-xs font-bold border border-emerald-200">
                {product.grade}
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ethio-950 leading-tight">
              {product.title}
            </h1>
            {product.variety && (
              <p className="text-sm font-semibold text-ethio-700 mt-1">
                Cultivar Variety: {product.variety}
              </p>
            )}
          </div>

          {/* Price Box */}
          <div className="p-6 rounded-3xl bg-white border border-sand-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Wholesale Farm-Gate Price
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-bold text-slate-600">ETB</span>
                <span className="text-3xl font-extrabold text-ethio-950">
                  {product.pricePerUnit.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-slate-500">
                  / {product.unit.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <span className="text-xs text-slate-500 block">Available Inventory</span>
              <span className="text-base font-extrabold text-emerald-800">
                {product.availableQty} {product.unit} in stock
              </span>
              <span className="text-[11px] text-slate-400 block">
                Min. Order: {product.minOrderQty} {product.unit}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Harvest Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => setNegotiateOpen(true)}
              className="py-3.5 px-6 rounded-2xl border-2 border-ethio-700 text-ethio-800 bg-white hover:bg-emerald-50 text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Scale className="w-4 h-4 text-ethio-700" />
              <span>Negotiate Bulk Price</span>
            </button>

            <button
              onClick={() => setDirectOrderOpen(true)}
              className="py-3.5 px-6 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >