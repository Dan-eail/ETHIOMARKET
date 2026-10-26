import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  ShoppingBag,
  Scale,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  MapPin,
  Building,
  AlertCircle,
  FileText,
  RotateCcw,
  Heart,
  Printer,
  ShieldCheck,
  Fingerprint,
  CreditCard,
  X
} from 'lucide-react'
import { KycVerificationModal } from '../../components/kyc/KycVerificationModal'

export const BuyerDashboard = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [orders, setOrders] = useState([])
  const [quotes, setQuotes] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders') // 'orders', 'quotes', 'saved'

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['orders', 'quotes', 'saved'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Invoice Modal
  const [invoiceData, setInvoiceData] = useState(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)

  // Counter Modal
  const [counterQuoteId, setCounterQuoteId] = useState(null)
  const [counterPrice, setCounterPrice] = useState('')
  const [counterNote, setCounterNote] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [repeatingOrderId, setRepeatingOrderId] = useState(null)
  const [kycModalOpen, setKycModalOpen] = useState(false)
  const [payingOrderId, setPayingOrderId] = useState(null)

  const handlePayWithChapa = async (orderId) => {
    setPayingOrderId(orderId)
    try {
      const res = await api.initializePayment({ orderId })
      if (res?.checkoutUrl) {
        window.location.href = res.checkoutUrl
      } else {
        triggerToast('Payment initiated: ' + (res.merchantReference || ''))
      }
    } catch (err) {
      alert(err.message || 'Payment initiation failed')
    } finally {
      setPayingOrderId(null)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordRes, quoteRes, favRes] = await Promise.all([
        api.getOrders({ as: 'buyer' }),
        api.getQuotes({ as: 'buyer' }),
        api.getFavorites().catch(() => ({ favorites: [] }))
      ])
      setOrders(ordRes.orders || [])
      setQuotes(quoteRes.quotes || [])
      setFavorites(favRes.favorites || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const triggerToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  const handleViewInvoice = async (orderId) => {
    setLoadingInvoice(true)
    try {
      const res = await api.getOrderInvoice(orderId)
      setInvoiceData(res.invoice)
    } catch (err) {
      alert(err.message || 'Failed to load invoice')
    } finally {
      setLoadingInvoice(false)
    }
  }

  const handleRepeatOrder = async (orderId) => {
    setRepeatingOrderId(orderId)
    try {
      const res = await api.repeatOrder(orderId)
      triggerToast(`Order repeated successfully! New Order #${res.order.orderNumber} placed.`)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to repeat order')
    } finally {
      setRepeatingOrderId(null)
    }
  }

  const handleAcceptQuote = async (quoteId) => {
    try {
      await api.acceptQuote(quoteId)
      triggerToast('Quotation accepted! Confirmed order generated.')
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCounterSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.counterQuote(counterQuoteId, {
        proposedPrice: parseFloat(counterPrice),
        note: counterNote
      })
      setCounterQuoteId(null)
      triggerToast('Counter-offer sent to farmer!')
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const totalSpentETB = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const activeOrdersCount = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length
  const openQuotesCount = quotes.filter(q => q.status === 'PENDING' || q.status === 'COUNTERED').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ethio-900 text-white px-5 py-3 rounded-2xl shadow-float flex items-center gap-3 border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sand-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Buyer Procurement Workspace
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-ethio-950 mt-1">
            Welcome, {user?.name || 'Almaz'}
          </h1>
          <p className="text-xs text-slate-500">
            {user?.buyerProfile?.businessName || 'Addis Fresh Distributors'} · {user?.buyerProfile?.region || 'Addis Ababa'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setKycModalOpen(true)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              user?.isVerified
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm'
            }`}
          >
            {user?.isVerified ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>National ID Verified</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                <span>Verify Identity (Fayda KYC)</span>
              </>
            )}
          </button>

          <Link
            to="/marketplace"
            className="px-5 py-2.5 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Find Direct Produce Suppliers</span>
          </Link>
        </div>
      </div>

      {/* Sourcing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Active Orders En Route</span>
            <Truck className="w-4 h-4 text-ethio-700" />
          </div>
          <div className="text-2xl font-extrabold text-ethio-950">
            {activeOrdersCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Direct from farm gates
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Open Price Negotiations</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            {openQuotesCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Awaiting agreement
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Total Procurement Spend</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-ethio-950">
            ETB {totalSpentETB.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            Escrow protected
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-sand-border pb-3">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-ethio-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          My Orders & Delivery Tracking ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'quotes'
              ? 'bg-ethio-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          Negotiations & Quotes ({quotes.length})
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'saved'
              ? 'bg-ethio-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          Saved Produce & Suppliers ({favorites.length})
        </button>
      </div>

      {/* TAB 1: ORDERS & LOGISTICS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-sand-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-sand-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Procurement Orders</h3>
            <span className="text-xs text-slate-500">Includes real-time transporter updates</span>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No orders placed yet.</div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-ethio-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800">Seller: {order.seller?.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-ethio-900">
                        {order.status}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">
                        ETB {order.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-sand-subtle grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">Items Sourced:</span>
                      {order.items?.map(i => (
                        <p key={i.id} className="font-semibold text-slate-800">
                          {i.quantity} {i.productUnit} · {i.productName} (ETB {i.unitPrice}/{i.productUnit})
                        </p>
                      ))}
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">Haulage & Delivery:</span>
                      <p className="text-slate-700">
                        Destination: {order.deliveryAddressSnapshot}
                      </p>
                      {order.delivery?.transporter && (
                        <p className="text-emerald-700 font-bold mt-1">
                          Assigned Transporter: {order.delivery.transporter.companyName} (★ {order.delivery.transporter.rating})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Handover Code */}
                  {order.delivery?.deliveryVerificationCode && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-900 font-bold">🔐 Delivery Handover Verification Code:</span>
                        <span className="font-mono font-extrabold text-emerald-950 bg-white px-2.5 py-0.5 rounded-md border border-emerald-300 tracking-wider">
                          {order.delivery.deliveryVerificationCode}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        (Provide to driver ONLY after inspecting cargo)
                      </span>
                    </div>
                  )}

                  {/* Delivery Event Timeline */}
                  {order.delivery?.events && order.delivery.events.length > 0 && (
                    <div className="pl-4 border-l-2 border-emerald-500 space-y-1.5 text-xs">
                      <span className="text-[11px] font-bold text-emerald-800 block">Latest Logistics Event:</span>
                      <p className="font-semibold text-slate-800">
                        {order.delivery.events[0].description} ({order.delivery.events[0].location})
                      </p>
                    </div>
                  )}

                  {/* Order Actions: Invoice & Repeat & Chapa Payment */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleViewInvoice(order.id)}
                        disabled={loadingInvoice}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-ethio-700" />
                        <span>View Official Fiscal Invoice (15% VAT)</span>
                      </button>

                      <button
                        onClick={() => handleRepeatOrder(order.id)}
                        disabled={repeatingOrderId === order.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sand-bg hover:bg-slate-200 text-xs font-bold text-ethio-900 transition-colors border border-sand-border"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-ethio-700" />
                        <span>{repeatingOrderId === order.id ? 'Placing Repeat...' : 'Repeat This Order'}</span>
                      </button>
                    </div>

                    {!order.isPaid && order.paymentStatus !== 'PAID' && (
                      <button
                        onClick={() => handlePayWithChapa(order.id)}
                        disabled={payingOrderId === order.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{payingOrderId === order.id ? 'Connecting to Chapa...' : `Pay via Chapa (ETB ${order.totalAmount.toLocaleString()})`}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUOTES */}
      {activeTab === 'quotes' && (
        <div className="bg-white rounded-3xl border border-sand-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-sand-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active Price Negotiations</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {quotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No active quotations.</div>
            ) : (
              quotes.map((q) => (
                <div key={q.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md">
                        #{q.quoteNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{q.product?.title}</span>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        {q.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Producer: <strong>{q.seller?.name}</strong> · Offered: <strong>{q.offeredPrice || q.requestedPrice} ETB</strong> / {q.unit}
                    </p>

                    {q.counterpartyNote && (
                      <p className="text-xs text-slate-600 italic bg-sand-subtle p-2.5 rounded-xl">
                        Farmer: "{q.counterpartyNote}"
                      </p>
                    )}
                  </div>

                  {q.status !== 'ACCEPTED' && q.status !== 'REJECTED' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setCounterQuoteId(q.id)
                          setCounterPrice(q.offeredPrice || q.requestedPrice)
                        }}
                        className="px-3.5 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Counter Again
                      </button>
                      <button
                        onClick={() => handleAcceptQuote(q.id)}
                        className="px-4 py-2 rounded-xl bg-ethio-700 hover:bg-ethio-800 text-white text-xs font-bold shadow-sm"
                      >
                        Accept Terms & Place Order
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* COUNTER MODAL */}
      {counterQuoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-float border border-sand-border my-auto">
            <h3 className="text-sm font-bold text-slate-900">Send Revised Counter-Offer</h3>
            <form onSubmit={handleCounterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Price (ETB)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs font-semibold focus:ring-2 focus:ring-ethio-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note</label>
                <textarea
                  rows="2"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="e.g. Can do this price if delivery is made this Friday."
                  className="w-full px-4 py-2 rounded-2xl border border-sand-border text-xs resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCounterQuoteId(null)}
                  className="px-4 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-ethio-700 text-white text-xs font-bold shadow-sm"
                >
                  Send Counter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED FAVORITES & SUPPLIERS */}
      {activeTab === 'saved' && (
        <div className="bg-white rounded-3xl border border-sand-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-sand-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Saved Produce & Bookmarked Suppliers</h3>
            <span className="text-xs text-slate-500">{favorites.length} saved</span>
          </div>

          <div className="p-6">
            {favorites.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No saved produce items yet</p>
                <p className="text-xs text-slate-500">Click the heart button on any marketplace listing to bookmark it here for quick repeat orders.</p>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ethio-700 text-white text-xs font-bold mt-2"
                >
                  Explore Marketplace
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {favorites.map((fav) => (
                  <div key={fav.id} className="p-4 rounded-2xl border border-sand-border bg-white shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="aspect-[16/10] rounded-xl overflow-hidden bg-sand-subtle mb-3">
                        <img
                          src={fav.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80'}
                          alt={fav.product?.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{fav.product?.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Supplier: {fav.product?.seller?.name}</p>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-xs font-bold text-slate-600">ETB</span>
                        <span className="text-base font-extrabold text-ethio-950">
                          {fav.product?.pricePerUnit?.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">/ {fav.product?.unit?.toLowerCase()}</span>
                      </div>
                    </div>
                    <Link
                      to={`/products/${fav.product?.id}`}
                      className="w-full py-2 px-3 rounded-xl bg-ethio-700 text-white text-xs font-bold text-center block hover:bg-ethio-800 transition-colors"
                    >
                      View & Order
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OFFICIAL ETHIOPIAN FISCAL INVOICE MODAL */}
      {invoiceData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-float border border-sand-border my-auto">
            {/* Invoice Header (shrink-0) */}
            <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-200 flex items-start justify-between bg-white shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <h2 className="text-lg font-black text-ethio-950 tracking-tight">EthioMarket Fiscal Commercial Invoice</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">Federal Democratic Republic of Ethiopia Ministry of Revenues Compliance</p>
              </div>
              <button
                onClick={() => setInvoiceData(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Invoice Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 overscroll-contain">
              {/* Key Reference Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-sand-subtle text-xs text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Invoice No</span>
                  <strong className="text-ethio-950 font-mono">{invoiceData.invoiceNumber}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Order No</span>
                  <strong className="text-slate-900 font-mono">{invoiceData.orderNumber}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Date Issued</span>
                  <span className="text-slate-800">{new Date(invoiceData.issueDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Payment Status</span>
                  <span className="font-bold text-emerald-800">{invoiceData.paymentStatus}</span>
                </div>
              </div>

              {/* Buyer & Seller Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Supplier (Seller)</span>
                  <h4 className="font-bold text-slate-900 text-sm">{invoiceData.seller?.farmName}</h4>
                  <p className="text-slate-600">Rep: {invoiceData.seller?.name}</p>
                  <p className="text-slate-600">Phone: {invoiceData.seller?.phone}</p>
                  <p className="text-slate-500 font-mono">TIN: {invoiceData.seller?.tin}</p>
                  <p className="text-slate-500">Location: {invoiceData.seller?.region}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Procuring Entity (Buyer)</span>
                  <h4 className="font-bold text-slate-900 text-sm">{invoiceData.buyer?.company}</h4>
                  <p className="text-slate-600">Contact: {invoiceData.buyer?.name}</p>
                  <p className="text-slate-600">Phone: {invoiceData.buyer?.phone}</p>
                  <p className="text-slate-500 font-mono">TIN: {invoiceData.buyer?.tin}</p>
                  <p className="text-slate-500">Destination: {invoiceData.buyer?.address}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <th className="pb-2">Description</th>
                      <th className="pb-2 text-right">Quantity</th>
                      <th className="pb-2 text-right">Unit Rate (ETB)</th>
                      <th className="pb-2 text-right">Amount (ETB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceData.lineItems?.map((item, idx) => (
                      <tr key={idx} className="text-slate-800">
                        <td className="py-2.5 font-semibold">{item.description}</td>
                        <td className="py-2.5 text-right">{item.quantity} {item.unit}</td>
                        <td className="py-2.5 text-right">{item.unitPrice.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-bold">{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="border-t border-slate-200 pt-4 space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Produce Subtotal:</span>
                  <span className="font-semibold">ETB {invoiceData.financials?.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Agricultural Logistics Haulage:</span>
                  <span className="font-semibold">ETB {invoiceData.financials?.deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Ethiopian Value Added Tax (VAT 15%):</span>
                  <span className="font-semibold">ETB {invoiceData.financials?.vatAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-black text-ethio-950 pt-2 border-t border-slate-200">
                  <span>Total Invoice Due (ETB):</span>
                  <span>ETB {invoiceData.financials?.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Pinned Invoice Footer Actions */}
            <div className="px-6 py-4 sm:px-8 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-400">Electronic fiscal record generated via EthioMarket Platform</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-700 hover:bg-white transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceData(null)}
                  className="px-5 py-2 rounded-xl bg-ethio-700 text-white text-xs font-bold hover:bg-ethio-800 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Verification Modal */}
      <KycVerificationModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        onVerificationSuccess={() => {
          loadData()
          triggerToast('Identity verification updated!')
        }}
      />
    </div>
  )
}
