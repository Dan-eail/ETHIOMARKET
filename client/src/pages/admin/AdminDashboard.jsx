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
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Submitted At</span>
                        <span>{new Date(rec.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {rec.userNotes && (
                      <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100">
                        "{rec.userNotes}"
                      </p>
                    )}

                    {/* Review Decision Notes if reviewed */}
                    {rec.reviewerNotes && (
                      <div className="p-2.5 rounded-xl bg-slate-100 text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-[11px] block">Reviewer Decision Rationale:</span>
                        <p>{rec.reviewerNotes}</p>
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        {rec.documentFilePath ? (
                          <a
                            href={`/api/v1/kyc/documents/${rec.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sand-border bg-white text-xs font-bold text-emerald-800 hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-700" />
                            <span>View Attached Document Copy</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">No external file attached</span>
                        )}
                      </div>

                      {rec.status === 'PENDING_REVIEW' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setKycModal({ isOpen: true, record: rec, action: 'info', reason: '' })}
                            className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors"
                          >
                            Request Info
                          </button>
                          <button
                            onClick={() => setKycModal({ isOpen: true, record: rec, action: 'reject', reason: '' })}
                            className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-xs font-bold hover:bg-rose-100 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => setKycModal({ isOpen: true, record: rec, action: 'approve', reason: '' })}
                            className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-sm transition-all"
                          >
                            Approve Credential
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* TAB: CHAPA PAYMENTS & RECONCILIATION */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-sand-border shadow-card overflow-hidden space-y-4">
          <div className="px-6 py-4 border-b border-sand-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chapa Merchant Payment Ledger</h3>
              <p className="text-xs text-slate-500">Tracking buyer payments into EthioMarket's merchant account and automated reconciliation</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total Records: {payments.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No merchant payments initiated yet.</div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="p-5 px-6 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-slate-900 bg-sand-bg px-2.5 py-1 rounded-lg border border-sand-border">
                        {p.merchantReference}
                      </span>
                      <span className="text-xs font-bold text-slate-700">Order: #{p.order?.orderNumber}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-extrabold text-slate-900">
                        ETB {p.amount.toLocaleString()}
                      </span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        p.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : p.status === 'INITIATED' || p.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : p.status === 'REFUNDED'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-slate-600 p-3.5 rounded-2xl bg-sand-bg/60 border border-sand-border">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Buyer</span>
                      <span className="font-semibold text-slate-800">{p.buyer?.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Provider Ref</span>
                      <span className="font-mono text-slate-700">{p.providerReference || 'Pending Chapa Callback'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Method</span>
                      <span className="capitalize">{p.providerMethod || 'Chapa Hosted'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Initiated</span>
                      <span>{new Date(p.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions: Reconcile with Chapa / Issue Refund */}
                  <div className="pt-1 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleReconcilePayment(p.id)}
                      disabled={reconcilingId === p.id}
                      className="px-3.5 py-1.5 rounded-xl border border-sand-border bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${reconcilingId === p.id ? 'animate-spin' : ''}`} />
                      <span>{reconcilingId === p.id ? 'Reconciling...' : 'Reconcile with Chapa'}</span>
                    </button>

                    {p.status === 'SUCCESS' && (
                      <button
                        onClick={() => setRefundModal({ isOpen: true, payment: p, amount: p.amount.toString(), reason: '' })}
                        className="px-3.5 py-1.5 rounded-xl border border-purple-300 bg-purple-50 text-purple-800 text-xs font-bold hover:bg-purple-100 transition-colors"
                      >
                        Process Refund
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: ANALYTICS CHARTS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl border border-sand-border shadow-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Trading Volume by Produce Category (ETB)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={11} stroke="#888888" />
                  <YAxis fontSize={11} stroke="#888888" tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(value) => [`ETB ${value.toLocaleString()}`, 'GMV']} />
                  <Bar dataKey="gmv" fill="#2d714b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-sand-border shadow-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Platform Security & Audit Status</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block">Fayda National e-KYC Boundary</span>
                  <span className="text-[11px] text-emerald-700">OIDC PKCE Protocol Active</span>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="p-3.5 rounded-2xl bg-sand-bg border border-sand-border flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Chapa Merchant API Integration</span>
                  <span className="text-[11px] text-slate-500">HMAC-SHA256 Webhooks & Server-Side Verification</span>
                </div>
                <CreditCard className="w-5 h-5 text-emerald-700" />
              </div>

              <div className="p-3.5 rounded-2xl bg-sand-bg border border-sand-border flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Private Document Storage</span>
                  <span className="text-[11px] text-slate-500">Restricted File Streaming with Access Audit</span>
                </div>
                <Lock className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-sand-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-sand-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Registered Platform Participants</h3>
            <span className="text-xs text-slate-400">Total: {users.length} accounts</span>
          </div>

          <div className="divide-y divide-slate-100">
            {users.map((u) => {
              const roleName = u.roles?.map(r => r.role).join(', ')
              const latestKyc = u.verificationRecords?.[0]
              return (
                <div key={u.id} className="p-4 px-6 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sand-bg text-slate-700 border border-sand-border">
                        {roleName}
                      </span>
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified ({latestKyc?.method || 'FAYDA'})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Unverified</span>
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-[11px] space-x-2">
                      <span>{u.email}</span>
                      <span>·</span>
                      <span>{u.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVerify(u.id, u.isVerified)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        u.isVerified
                          ? 'border-sand-border text-slate-600 hover:bg-slate-100'
                          : 'border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {u.isVerified ? 'Revoke Verification' : 'Grant Verification'}
                    </button>

                    <button
                      onClick={() => handleToggleUserStatus(u.id, u.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        u.status === 'ACTIVE'
                          ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-sand-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-sand-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Security & Operational Audit Trails</h3>
            <span className="text-xs text-slate-400">Immutable ledger records</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No audit logs recorded yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-4 px-6 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 bg-sand-subtle px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-700">By: {log.user?.name || 'System Admin'}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{log.details}</p>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* KYC DECISION MODAL */}
      {kycModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-sand-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {kycModal.action === 'approve' ? 'Approve Credential' : kycModal.action === 'reject' ? 'Reject Credential' : 'Request Additional Information'}
              </h3>
              <button
                onClick={() => setKycModal({ isOpen: false, record: null, action: 'approve', reason: '' })}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              User: <strong>{kycModal.record?.user?.name}</strong> ({kycModal.record?.documentType || 'Manual Verification'})
            </p>

            <form onSubmit={handleKycDecision} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Decision Rationale / Notes (Audited)
                </label>
                <textarea
                  rows={3}
                  required
                  value={kycModal.reason}
                  onChange={(e) => setKycModal({ ...kycModal, reason: e.target.value })}
                  placeholder="e.g. Kebele document verified against municipal seal; identity matches registered producer name."
                  className="w-full px-3.5 py-2 rounded-xl border border-sand-border text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setKycModal({ isOpen: false, record: null, action: 'approve', reason: '' })}
                  className="px-4 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingKyc}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition-all ${
                    kycModal.action === 'approve'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {submittingKyc ? 'Processing...' : `Confirm ${kycModal.action}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {refundModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-sand-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Process Transaction Refund</h3>
              <button
                onClick={() => setRefundModal({ isOpen: false, payment: null, amount: '', reason: '' })}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-sand-bg rounded-2xl text-xs space-y-1">
              <div>Merchant Ref: <strong className="font-mono">{refundModal.payment?.merchantReference}</strong></div>
              <div>Order Total: <strong>ETB {refundModal.payment?.amount?.toLocaleString()}</strong></div>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Refund Amount (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={refundModal.amount}
                  onChange={(e) => setRefundModal({ ...refundModal, amount: e.target.value })}
                  max={refundModal.payment?.amount}
                  className="w-full px-3.5 py-2 rounded-xl border border-sand-border text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Refund Reason (Audited)
                </label>
                <textarea
                  rows={2}
                  required
                  value={refundModal.reason}
                  onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })}
                  placeholder="e.g. Order cancellation requested prior to dispatch; quality non-conformance."
                  className="w-full px-3.5 py-2 rounded-xl border border-sand-border text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModal({ isOpen: false, payment: null, amount: '', reason: '' })}
                  className="px-4 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRefund}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {submittingRefund ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
