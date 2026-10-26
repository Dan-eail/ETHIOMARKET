import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Sprout,
  Plus,
  Package,
  ShoppingBag,
  Scale,
  Truck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  X
} from 'lucide-react'
import { KycVerificationModal } from '../../components/kyc/KycVerificationModal'

export const FarmerDashboard = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [listings, setListings] = useState([])
  const [orders, setOrders] = useState([])
  const [quotes, setQuotes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('listings') // 'listings', 'orders', 'quotes'
  const [kycModalOpen, setKycModalOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('action') === 'new-produce') {
      setAddModalOpen(true)
    }
    const tabParam = searchParams.get('tab')
    if (tabParam && ['listings', 'orders', 'quotes'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Add Product Modal
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    title: '',
    categoryId: '',
    description: '',
    variety: '',
    grade: 'Grade 1 Wholesale',
    unit: 'QUINTAL',
    pricePerUnit: '',
    availableQty: '',
    minOrderQty: '5',
    region: 'Oromia',
    city: 'Meki',
    isOrganic: true,
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80',
  })
  const [savingProduct, setSavingProduct] = useState(false)

  // Quick Stock Adjustment Modal
  const [stockModalProduct, setStockModalProduct] = useState(null)
  const [stockQty, setStockQty] = useState('')
  const [stockThreshold, setStockThreshold] = useState('')
  const [savingStock, setSavingStock] = useState(false)

  // Counter Modal
  const [counterQuoteId, setCounterQuoteId] = useState(null)
  const [counterPrice, setCounterPrice] = useState('')
  const [counterNote, setCounterNote] = useState('')

  const [toastMessage, setToastMessage] = useState('')

  const openStockModal = (product) => {
    setStockModalProduct(product)
    setStockQty(product.availableQty.toString())
    setStockThreshold((product.lowStockThreshold || 10).toString())
  }

  const handleSaveStock = async (e) => {
    e.preventDefault()
    if (!stockModalProduct) return
    setSavingStock(true)
    try {
      await api.updateStock(stockModalProduct.id, {
        availableQty: parseFloat(stockQty),
        lowStockThreshold: parseFloat(stockThreshold)
      })
      triggerToast('Produce inventory updated successfully!')
      setStockModalProduct(null)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to update stock')
    } finally {
      setSavingStock(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [listRes, ordRes, quoteRes, catRes] = await Promise.all([
        api.getFarmerListings(),
        api.getOrders({ as: 'seller' }),
        api.getQuotes({ as: 'seller' }),
        api.getCategories()
      ])
      setListings(listRes.listings || [])
      setOrders(ordRes.orders || [])
      setQuotes(quoteRes.quotes || [])
      setCategories(catRes.categories || [])
      if (catRes.categories?.[0] && !newProduct.categoryId) {
        setNewProduct(prev => ({ ...prev, categoryId: catRes.categories[0].id }))
      }
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

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    setSavingProduct(true)
    try {
      const payload = {
        title: newProduct.title,
        categoryId: newProduct.categoryId || categories[0]?.id,
        description: newProduct.description,
        variety: newProduct.variety,
        grade: newProduct.grade,
        unit: newProduct.unit,
        pricePerUnit: parseFloat(newProduct.pricePerUnit),
        availableQty: parseFloat(newProduct.availableQty),
        minOrderQty: parseFloat(newProduct.minOrderQty) || 1,
        region: newProduct.region,
        city: newProduct.city,
        isOrganic: newProduct.isOrganic,
        imageUrls: [newProduct.imageUrl]
      }
      await api.createProduct(payload)
      setAddModalOpen(false)
      triggerToast('Produce listing published to Ethiopian marketplace!')
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to create listing')
    } finally {
      setSavingProduct(false)
    }
  }

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus)
      triggerToast(`Order status updated to ${newStatus}`)
      loadData()
    } catch (err) {
      alert(err.message)
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
      triggerToast('Counter-offer sent to buyer!')
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  // Calculate Metrics
  const totalSalesETB = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0)
  const pendingOrdersCount = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PROCESSING').length
  const pendingQuotesCount = quotes.filter(q => q.status === 'PENDING' || q.status === 'COUNTERED').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ethio-900 text-white px-5 py-3 rounded-2xl shadow-float flex items-center gap-3 border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sand-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Farmer Workspace
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-ethio-950 mt-1">
            Good morning, {user?.name || 'Abebe'}
          </h1>
          <p className="text-xs text-slate-500">
            {user?.farmerProfile?.farmName || 'Rift Valley Agro'} · {user?.farmerProfile?.region || 'Oromia'}, Ethiopia
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

          <button
            onClick={() => {
              if (!user?.isVerified) {
                setKycModalOpen(true)
                triggerToast('Identity verification required before publishing produce listings.')
                return
              }
              setAddModalOpen(true)
            }}
            className="px-5 py-2.5 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product Listing</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Sales */}
        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Sales Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-ethio-950">
            ETB {totalSalesETB.toLocaleString()}
          </div>
          <div className="text-[11px] font-semibold text-emerald-700">
            Verified payouts
          </div>
        </div>

        {/* Active Listings */}
        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Active Listings</span>
            <Package className="w-4 h-4 text-ethio-700" />
          </div>
          <div className="text-2xl font-extrabold text-ethio-950">
            {listings.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Published in marketplace
          </div>
        </div>

        {/* New Orders */}
        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Incoming Orders</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            {pendingOrdersCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Requires packaging & pickup
          </div>
        </div>

        {/* Buyer Offers */}
        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Buyer Offers</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            {pendingQuotesCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Awaiting price counter/acceptance
          </div>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-sand-border pb-3">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'listings'
              ? 'bg-ethio-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          My Produce Listings ({listings.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-ethio-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          Orders Received ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'quotes'
              ? 'bg-ethio-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          Negotiation Quotes ({quotes.length})
        </button>
      </div>

      {/* TAB 1: MY LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listings.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl border border-sand-border p-5 shadow-card space-y-4">
                <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-sand-subtle relative">
                  <img
                    src={item.images?.[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-bold">
                    {item.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xs font-bold text-slate-600">ETB</span>
                    <span className="text-lg font-extrabold text-ethio-950">
                      {item.pricePerUnit.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500">/ {item.unit.toLowerCase()}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-sand-subtle space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Available Stock:</span>
                    <strong className={`text-sm ${item.availableQty <= (item.lowStockThreshold || 10) ? 'text-amber-700 font-extrabold' : 'text-emerald-800 font-bold'}`}>
                      {item.availableQty} {item.unit}
                    </strong>
                  </div>

                  {item.availableQty <= (item.lowStockThreshold || 10) && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-xl">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Low Stock Alert (Threshold: {item.lowStockThreshold || 10} {item.unit})</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[11px]">
                    <span>Reserved for Orders:</span>
                    <span>{item.reservedQty} {item.unit}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Location:</span>
                    <span>{item.city}, {item.region}</span>
                  </div>

                  {/* Performance Insights */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                    <span>👁️ {item.viewsCount || 0} views</span>
                    <span>💬 {item._count?.quotes || 0} offers</span>
                    <span>📦 {item._count?.orderItems || 0} orders</span>
                  </div>
                </div>

                <button
                  onClick={() => openStockModal(item)}
                  className="w-full py-2 px-3 rounded-2xl border border-ethio-700/30 text-ethio-800 hover:bg-emerald-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Adjust Stock & Alerts</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INCOMING ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-sand-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-sand-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Buyer Orders & Fulfillment</h3>
            <span className="text-xs text-slate-500">Updated in real-time</span>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No orders received yet.</div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-ethio-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-bold text-slate-700">Buyer: {order.buyer?.name}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {order.items?.map(i => `${i.quantity} ${i.productUnit} of ${i.productName}`).join(', ')}
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Total: ETB {order.totalAmount.toLocaleString()} ({order.paymentMethod})
                    </div>
                    {order.delivery?.pickupVerificationCode && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                        <span className="text-amber-800 font-bold">🔐 Transporter Pickup Code:</span>
                        <span className="font-mono font-extrabold text-amber-900 bg-white px-2.5 py-0.5 rounded-md border border-amber-300 tracking-wider">
                          {order.delivery.pickupVerificationCode}
                        </span>
                        <span className="text-[10px] text-amber-700">(Provide this code to driver at farm handover)</span>
                      </div>
                    )}
                  </div>

                  {/* Actions / Status changer */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      Status: {order.status}
                    </span>
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleOrderStatusUpdate(order.id, 'PROCESSING')}
                        className="px-3 py-1.5 rounded-xl bg-ethio-700 hover:bg-ethio-800 text-white text-xs font-bold"
                      >
                        Start Packaging
                      </button>
                    )}
                    {order.status === 'PROCESSING' && (
                      <button
                        onClick={() => handleOrderStatusUpdate(order.id, 'READY_FOR_PICKUP')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                      >
                        Ready For Truck Pickup
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: QUOTES & OFFERS */}
      {activeTab === 'quotes' && (
        <div className="bg-white rounded-3xl border border-sand-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-sand-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Incoming Buyer Quotes & Price Negotiations</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {quotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No quotation requests currently open.</div>
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
                      Buyer: <strong>{q.buyer?.name}</strong> proposed <strong>{q.requestedPrice} ETB</strong> for <strong>{q.requestedQty} {q.unit}</strong>
                      {q.offeredPrice && ` (Latest counter: ${q.offeredPrice} ETB)`}
                    </p>

                    {q.note && (
                      <p className="text-xs text-slate-500 italic bg-sand-subtle p-2.5 rounded-xl">