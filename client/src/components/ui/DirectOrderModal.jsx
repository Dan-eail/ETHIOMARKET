import React, { useState } from 'react'
import { X, ShoppingBag, Truck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export const DirectOrderModal = ({ product, isOpen, onClose, onSuccess }) => {
  const { user, isAuthenticated } = useAuth()
  const [quantity, setQuantity] = useState(product?.minOrderQty || 10)
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY')
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.buyerProfile?.deliveryAddress || 'Bole Medhanialem Logistics Hub, Addis Ababa'
  )
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !product) return null

  const subtotal = (parseFloat(quantity) || 0) * product.pricePerUnit
  const estimatedDelivery = 2500 // Regional logistics fee
  const totalAmount = subtotal + estimatedDelivery

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      setError('Please log in or select a demo role to place an order.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        productId: product.id,
        quantity: parseFloat(quantity),
        paymentMethod: paymentMethod === 'CHAPA' ? 'CHAPA' : paymentMethod,
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim(),
      }

      const res = await api.createDirectOrder(payload)

      if (paymentMethod === 'CHAPA' || paymentMethod === 'TELEBIRR' || paymentMethod === 'CBE_BIRR') {
        const payRes = await api.initializePayment({ orderId: res.order.id })
        if (payRes?.checkoutUrl) {
          window.location.href = payRes.checkoutUrl
          return
        }
      }

      if (onSuccess) onSuccess(res.order)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-float border border-sand-border my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-sand-border flex items-center justify-between bg-sand-bg shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-ethio-700 text-white flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Direct Purchase Checkout</h3>
              <p className="text-[11px] text-slate-500">Atomic inventory reservation & transport assignment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form with scrollable body + pinned footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
            
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Product details */}
            <div className="p-3.5 rounded-2xl bg-sand-subtle flex items-center gap-3">
              <img
                src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop&q=80'}
                alt={product.title}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-900 truncate">{product.title}</h4>
                <p className="text-[11px] text-slate-500">
                  Rate: <strong className="text-ethio-800">{product.pricePerUnit.toLocaleString()} ETB</strong> / {product.unit.toLowerCase()}
                </p>
                <p className="text-[11px] text-slate-500">
                  Seller: {product.seller?.name || 'Verified Farmer'} ({product.city})
                </p>
              </div>
            </div>

            {/* Quantity */}