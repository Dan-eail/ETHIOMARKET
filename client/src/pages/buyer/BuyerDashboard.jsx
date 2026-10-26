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