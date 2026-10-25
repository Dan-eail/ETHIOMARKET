import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ShieldCheck, Tag, Sparkles, Scale, ArrowRight, Heart } from 'lucide-react'
import { api } from '../../services/api'

export const ProductCard = ({ product, onNegotiate, onBuyNow, isFavoritedInitial = false }) => {
  const [isFav, setIsFav] = useState(isFavoritedInitial)
  const [favLoading, setFavLoading] = useState(false)

  const handleToggleFav = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setFavLoading(true)
    try {
      const res = await api.toggleFavorite(product.id)
      setIsFav(res.favorited)
    } catch (err) {
      console.error(err)
    } finally {
      setFavLoading(false)
    }
  }

  const primaryImage = product.images?.find(i => i.isPrimary)?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80'

  const sellerName = product.seller?.name || 'Verified Farmer'
  const isSellerVerified = product.seller?.isVerified || product.seller?.farmerProfile?.verifiedBadge

  return (
    <div className="bg-white rounded-3xl border border-sand-border overflow-hidden card-hover flex flex-col justify-between group shadow-card">
      <div>
        {/* Image Container with Badges */}
        <div className="relative aspect-[4/3] overflow-hidden bg-sand-subtle">
          <img
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Organic / Quality Badge */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.isOrganic && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/95 text-white text-[11px] font-bold backdrop-blur-sm shadow-sm">
                <Sparkles className="w-3 h-3 text-emerald-200" />
                Organic
              </span>
            )}
            {product.grade && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/90 text-slate-800 text-[10px] font-bold backdrop-blur-sm shadow-sm border border-slate-200">
                {product.grade}
              </span>
            )}
          </div>

          {/* Favorite & Category Tag */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              onClick={handleToggleFav}
              disabled={favLoading}
              title={isFav ? 'Remove from saved' : 'Save to favorites'}
              className="p-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-slate-600 hover:text-red-500 transition-colors"
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900/70 text-white text-[11px] font-semibold backdrop-blur-sm">
              {product.category?.name || 'Produce'}
            </span>
          </div>

          {/* Location Bar at bottom of image */}
          <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-2xl bg-white/90 backdrop-blur-md text-xs font-semibold text-slate-700 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-ethio-700 shrink-0" />
              <span className="truncate">{product.city}, {product.region}</span>
            </div>
            {isSellerVerified && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-ethio-700 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {/* Seller Bio / Farm Name */}
          <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
            <span className="truncate">{product.seller?.farmerProfile?.farmName || sellerName}</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
              Stock: {product.availableQty} {product.unit}
            </span>
          </div>

          {/* Title */}
          <Link to={`/products/${product.id}`} className="block group-hover:text-ethio-700 transition-colors">
            <h3 className="text-base font-bold text-slate-900 line-clamp-1 leading-snug">
              {product.title}
            </h3>
          </Link>

          {/* Variety / Description snippet */}
          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
            {product.variety ? `${product.variety} variety · ` : ''}{product.description}
          </p>

          {/* Price display */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Wholesale Rate</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-slate-600">ETB</span>
                <span className="text-xl font-extrabold text-ethio-950">
                  {product.pricePerUnit.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  / {product.unit.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-500">
              <span>Min. {product.minOrderQty} {product.unit.toLowerCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-5 pt-0 grid grid-cols-2 gap-2">
        <button
          onClick={() => onNegotiate ? onNegotiate(product) : null}
          className="w-full py-2.5 px-3 rounded-2xl border border-sand-border text-xs font-bold text-slate-700 bg-sand-bg hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <Scale className="w-3.5 h-3.5 text-ethio-700" />
          <span>Negotiate</span>
        </button>

        <button
          onClick={() => onBuyNow ? onBuyNow(product) : null}
          className="w-full py-2.5 px-3 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1 shadow-sm"
        >
          <span>Order Now</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
