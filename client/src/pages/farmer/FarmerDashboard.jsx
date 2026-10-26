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