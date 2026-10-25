import React, { useState } from 'react'
import { X, Scale, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export const NegotiateModal = ({ product, isOpen, onClose, onSuccess }) => {
  const { user, isAuthenticated } = useAuth()
  const [quantity, setQuantity] = useState(product?.minOrderQty || 10)
  const [offeredPrice, setOfferedPrice] = useState(product?.pricePerUnit ? Math.round(product.pricePerUnit * 0.95) : 100)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !product) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      setError('Please log in or select a demo role to submit a quotation offer.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        productId: product.id,
        requestedQty: parseFloat(quantity),
        requestedPrice: parseFloat(offeredPrice),
        note: note.trim() || `Proposed wholesale purchase of ${quantity} ${product.unit} at ${offeredPrice} ETB per unit.`,
      }
      const res = await api.createQuote(payload)
      if (onSuccess) onSuccess(res.quote)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to submit quote negotiation request')
    } finally {
      setLoading(false)
    }
  }

  const estTotal = (quantity * offeredPrice).toLocaleString()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-float border border-sand-border my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-sand-border flex items-center justify-between bg-sand-bg shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-ethio-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Request Bulk Quote & Negotiate</h3>
              <p className="text-[11px] text-slate-500">Direct price negotiation with {product.seller?.name || 'Farmer'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body + Pinned Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Product summary card */}
            <div className="p-3.5 rounded-2xl bg-sand-subtle flex items-center gap-3">
              <img
                src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop&q=80'}
                alt={product.title}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-900 truncate">{product.title}</h4>
                <p className="text-[11px] text-slate-500">
                  Listed Rate: <strong className="text-ethio-800 font-extrabold">{product.pricePerUnit.toLocaleString()} ETB</strong> / {product.unit.toLowerCase()}
                </p>
                <p className="text-[11px] text-slate-500">
                  Location: {product.city}, {product.region} · Min: {product.minOrderQty} {product.unit}
                </p>
              </div>
            </div>

            {/* Quantity & Proposed Price */}
            <div className="grid grid-cols-2 gap-4">