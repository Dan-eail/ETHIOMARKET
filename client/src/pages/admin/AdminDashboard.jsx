import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import {
  ShieldCheck,
  Users,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  CreditCard,
  RefreshCw,
  RotateCcw,
  Eye,
  Lock,
  Clock,
  Fingerprint
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export const AdminDashboard = () => {
  const [searchParams] = useSearchParams()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [kycRecords, setKycRecords] = useState([])
  const [payments, setPayments] = useState([])
  const [reconcileStats, setReconcileStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'kyc', 'payments', 'users', 'logs'
  const [toastMessage, setToastMessage] = useState('')

  // KYC Review Decision Modal
  const [kycModal, setKycModal] = useState({
    isOpen: false,
    record: null,
    action: 'approve', // 'approve', 'reject', 'info'
    reason: ''
  })
  const [submittingKyc, setSubmittingKyc] = useState(false)

  // Refund Modal
  const [refundModal, setRefundModal] = useState({
    isOpen: false,
    payment: null,
    amount: '',
    reason: ''
  })
  const [submittingRefund, setSubmittingRefund] = useState(false)
  const [reconcilingId, setReconcilingId] = useState(null)

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'kyc', 'payments', 'users', 'logs'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  useEffect(() => {
    loadAdminData()
  }, [])

  const triggerToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, logsRes, kycRes, payRes, recRes] = await Promise.all([
        api.getAdminStats(),
        api.getAllUsers(),
        api.getAuditLogs(),
        api.getAdminKycQueue().catch(() => ({ records: [] })),
        api.getPayments().catch(() => ({ payments: [] })),
        api.getPaymentReconciliationOverview().catch(() => ({ metrics: null }))
      ])
      setStats(statsRes.stats)
      setUsers(usersRes.users || [])
      setAuditLogs(logsRes.logs || [])
      setKycRecords(kycRes.records || [])
      setPayments(payRes.payments || [])
      setReconcileStats(recRes.metrics || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKycDecision = async (e) => {
    e.preventDefault()
    if (!kycModal.record) return
    if (!kycModal.reason || kycModal.reason.trim().length < 5) {
      alert('A mandatory rationale (minimum 5 characters) is required.')
      return
    }

    setSubmittingKyc(true)
    try {
      if (kycModal.action === 'approve') {
        await api.approveManualKyc(kycModal.record.id, { decisionReason: kycModal.reason.trim() })
        triggerToast('Manual verification APPROVED. Recorded as MANUAL_REVIEW.')
      } else if (kycModal.action === 'reject') {
        await api.rejectManualKyc(kycModal.record.id, { decisionReason: kycModal.reason.trim() })
        triggerToast('Manual verification REJECTED with recorded reason.')
      } else if (kycModal.action === 'info') {
        await api.requestManualKycInfo(kycModal.record.id, { actionRequiredReason: kycModal.reason.trim() })
        triggerToast('Additional information requested from user.')
      }
      setKycModal({ isOpen: false, record: null, action: 'approve', reason: '' })
      loadAdminData()
    } catch (err) {
      alert(err.message || 'Action failed')
    } finally {
      setSubmittingKyc(false)
    }
  }

  const handleReconcilePayment = async (paymentId) => {
    setReconcilingId(paymentId)
    try {
      const res = await api.reconcilePayment(paymentId)
      triggerToast(res.message || 'Payment reconciled with Chapa.')
      loadAdminData()
    } catch (err) {
      alert(err.message || 'Reconciliation failed.')
    } finally {
      setReconcilingId(null)
    }
  }

  const handleRefundSubmit = async (e) => {
    e.preventDefault()
    if (!refundModal.payment) return
    setSubmittingRefund(true)
    try {
      await api.requestRefund(refundModal.payment.id, {
        amount: parseFloat(refundModal.amount) || refundModal.payment.amount,
        reason: refundModal.reason.trim()
      })
      triggerToast('Refund processed and recorded.')
      setRefundModal({ isOpen: false, payment: null, amount: '', reason: '' })
      loadAdminData()
    } catch (err) {
      alert(err.message || 'Refund failed')
    } finally {
      setSubmittingRefund(false)
    }
  }

  const handleToggleVerify = async (userId, currentVerified) => {
    try {
      await api.verifyUser(userId, !currentVerified)
      triggerToast(`User verification toggled to ${!currentVerified}`)
      loadAdminData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    try {
      await api.updateUserStatus(userId, nextStatus)
      triggerToast(`User account status changed to ${nextStatus}`)
      loadAdminData()
    } catch (err) {
      alert(err.message)
    }
  }

  const chartData = [
    { name: 'Cereals & Teff', gmv: 345000 },
    { name: 'Coffee Export', gmv: 620000 },
    { name: 'Pulses & Oilseeds', gmv: 180000 },
    { name: 'Vegetables', gmv: 95000 },
    { name: 'Fruits', gmv: 54000 },
  ]

  const pendingKycCount = kycRecords.filter(r => r.status === 'PENDING_REVIEW').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-float flex items-center gap-3 border border-emerald-500/30 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />