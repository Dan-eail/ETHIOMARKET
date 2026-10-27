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