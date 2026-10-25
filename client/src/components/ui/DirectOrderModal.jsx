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
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Order Quantity ({product.unit})
              </label>
              <input
                type="number"
                min={product.minOrderQty}
                max={product.availableQty}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-sm font-semibold focus:ring-2 focus:ring-ethio-600 focus:outline-none"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Minimum order: {product.minOrderQty} {product.unit}</span>
                <span>Available stock: {product.availableQty} {product.unit}</span>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Destination Delivery Address
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
                placeholder="e.g. Merkato Main Grain Terminal #4, Addis Ababa"
                className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Payment Option
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CHAPA')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                    paymentMethod === 'CHAPA'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                      : 'border-sand-border bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>Chapa Online Checkout</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal block mt-0.5">Telebirr, CBE Birr, Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                    paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                      : 'border-sand-border bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cash on Delivery</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal block mt-0.5">Pay upon cargo delivery</span>
                </button>
              </div>
            </div>

            {/* Pricing summary */}
            <div className="p-3.5 rounded-2xl bg-sand-subtle space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Produce Subtotal:</span>
                <span className="font-bold text-slate-800">ETB {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Logistics / Haulage:</span>
                <span className="font-bold text-slate-800">ETB {estimatedDelivery.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-ethio-950">
                <span>Total Payable:</span>
                <span>ETB {totalAmount.toLocaleString()}</span>
              </div>
            </div>

          </div>

          {/* Pinned Action buttons footer */}
          <div className="px-6 py-3.5 border-t border-sand-border bg-slate-50 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-sand-border text-xs font-bold text-slate-600 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-xs font-bold text-white transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <span>Confirming Order...</span>
              ) : (
                <>
                  <span>Confirm & Place Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
