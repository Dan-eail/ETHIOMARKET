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
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sand-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Administration & Regulatory Compliance
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            EthioMarket Platform Operations
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            className="px-3.5 py-2 rounded-2xl bg-white border border-sand-border text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Platform Data</span>
          </button>
        </div>
      </div>

      {/* Key Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Marketplace GMV</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            ETB {stats?.totalGMV ? stats.totalGMV.toLocaleString() : '1,294,000'}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold">
            Platform Volume
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Chapa Settled</span>
            <CreditCard className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl font-extrabold text-emerald-800">
            ETB {reconcileStats?.totalVerifiedVolumeETB ? reconcileStats.totalVerifiedVolumeETB.toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-slate-500">
            Verified Merchant Account
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>KYC Review Queue</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold text-amber-700">
            {pendingKycCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Pending manual verifications
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Participants</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {users.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Producers, Buyers, Logistics
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Payments Tracked</span>
            <Package className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {payments.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Merchant transactions
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-sand-border pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          Marketplace Analytics
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'kyc'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>Fayda & Manual KYC Queue</span>
          {pendingKycCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingKycCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
          <span>Chapa Payments & Reconciliation ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          User Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'logs'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          Audit Ledger ({auditLogs.length})
        </button>
      </div>

      {/* TAB: KYC QUEUE */}
      {activeTab === 'kyc' && (
        <div className="bg-white rounded-3xl border border-sand-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-sand-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Identity Verification Submissions</h3>
              <p className="text-xs text-slate-500">Audited decisions for Fayda e-KYC and Controlled Manual Document Fallback</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total records: {kycRecords.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {kycRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No identity verification submissions currently in queue.</div>
            ) : (
              kycRecords.map((rec) => {
                const userRole = rec.user?.roles?.map(r => r.role).join(', ') || 'USER'
                return (
                  <div key={rec.id} className="p-5 px-6 space-y-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-extrabold text-slate-900">{rec.user?.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {userRole}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-600">{rec.user?.email || rec.user?.phone}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          rec.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'PENDING_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : rec.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rec.status}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sand-bg text-slate-600 border border-sand-border">
                          {rec.method}
                        </span>
                      </div>
                    </div>

                    {/* Submission Details */}
                    <div className="p-3.5 rounded-2xl bg-sand-bg/60 border border-sand-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Credential Type</span>
                        <span className="font-semibold text-slate-800">{rec.documentType || (rec.method === 'FAYDA' ? 'Fayda National ID' : 'N/A')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Identifier / Ref</span>
                        <span className="font-mono text-slate-700">{rec.documentNumber || (rec.providerRef ? `${rec.providerRef.slice(0, 15)}...` : 'N/A')}</span>