import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Truck,
  MapPin,
  Package,
  Calendar,
  CheckCircle2,
  Plus,
  Clock,
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  X
} from 'lucide-react'
import { KycVerificationModal } from '../../components/kyc/KycVerificationModal'

export const TransporterDashboard = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [availableJobs, setAvailableJobs] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available') // 'available', 'my-jobs', 'fleet'
  const [kycModalOpen, setKycModalOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('action') === 'register-vehicle') {
      setVehicleModalOpen(true)
    }
    const tabParam = searchParams.get('tab')
    if (tabParam && ['available', 'my-jobs', 'fleet'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Vehicle Registration Modal
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: '',
    vehicleType: 'ISUZU',
    capacityTons: '7.5',
    modelYear: '2023',
  })

  // Verification & Delay Modals
  const [pickupModalDelivery, setPickupModalDelivery] = useState(null)
  const [pickupCodeInput, setPickupCodeInput] = useState('')

  const [deliveryModalDelivery, setDeliveryModalDelivery] = useState(null)
  const [deliveryCodeInput, setDeliveryCodeInput] = useState('')

  const [delayModalDelivery, setDelayModalDelivery] = useState(null)
  const [delayReason, setDelayReason] = useState('')
  const [delayLocation, setDelayLocation] = useState('')

  const [toastMessage, setToastMessage] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [availRes, myRes] = await Promise.all([
        api.getAvailableDeliveries(),
        api.getMyDeliveries()
      ])
      setAvailableJobs(availRes.deliveries || [])
      setMyJobs(myRes.deliveries || [])
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

  const handleVerifyPickupSubmit = async (e) => {
    e.preventDefault()
    if (!pickupModalDelivery) return
    try {
      await api.verifyPickup(pickupModalDelivery.id, { code: pickupCodeInput })
      triggerToast('Farm pickup verified! Cargo is now in transit.')
      setPickupModalDelivery(null)
      setPickupCodeInput('')
      loadData()
    } catch (err) {
      alert(err.message || 'Verification failed. Please check the code with the farmer.')
    }
  }

  const handleVerifyDeliverySubmit = async (e) => {
    e.preventDefault()
    if (!deliveryModalDelivery) return
    try {
      await api.verifyDelivery(deliveryModalDelivery.id, { code: deliveryCodeInput })
      triggerToast('Customer delivery verified & completed! Haulage fee released.')
      setDeliveryModalDelivery(null)
      setDeliveryCodeInput('')
      loadData()
    } catch (err) {
      alert(err.message || 'Delivery verification failed. Please check the code with the recipient.')
    }
  }

  const handleReportDelaySubmit = async (e) => {
    e.preventDefault()
    if (!delayModalDelivery) return
    try {
      await api.reportDelay(delayModalDelivery.id, {
        reason: delayReason,
        location: delayLocation
      })
      triggerToast('Transit notice / delay logged and notified to buyer.')
      setDelayModalDelivery(null)
      setDelayReason('')
      setDelayLocation('')
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to report delay')
    }
  }

  const handleClaimJob = async (deliveryId) => {
    try {
      await api.claimDelivery(deliveryId)
      triggerToast('Cargo delivery job claimed! Vehicle assigned.')
      loadData()
      setActiveTab('my-jobs')
    } catch (err) {
      alert(err.message || 'Failed to claim job')
    }
  }

  const handleUpdateStatus = async (deliveryId, newStatus, desc, loc) => {
    try {
      await api.addDeliveryEvent(deliveryId, {
        status: newStatus,
        description: desc,
        location: loc
      })
      triggerToast(`Delivery updated to ${newStatus}`)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleRegisterVehicle = async (e) => {
    e.preventDefault()
    try {
      await api.registerVehicle(vehicleForm)
      setVehicleModalOpen(false)
      triggerToast('Vehicle registered and verified!')
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const completedCount = myJobs.filter(j => j.status === 'DELIVERED').length
  const inProgressCount = myJobs.filter(j => j.status !== 'DELIVERED' && j.status !== 'CANCELLED').length
  const totalEarningsETB = myJobs.filter(j => j.status === 'DELIVERED').reduce((sum, j) => sum + (j.deliveryFee || 0), 0)

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
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Logistics & Haulage Fleet
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-ethio-950 mt-1">
            Good morning, {user?.name || 'Kebede'}
          </h1>
          <p className="text-xs text-slate-500">
            {user?.transporterProfile?.companyName || 'Abyssinia Fast Cargo'} · License {user?.transporterProfile?.licenseNumber || 'ETH-TRANS-2024'}
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
            onClick={() => setVehicleModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vehicle</span>
          </button>
        </div>
      </div>

      {/* Logistics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Available Delivery Jobs</span>
            <Package className="w-4 h-4 text-ethio-700" />
          </div>
          <div className="text-2xl font-extrabold text-ethio-950">
            {availableJobs.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Ready for dispatch
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>In-Transit Haulage</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            {inProgressCount}
          </div>
          <div className="text-[11px] text-slate-500">
            En route to destinations
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-sand-border shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Completed Trips & Earnings</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-ethio-950">
            ETB {totalEarningsETB.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            {completedCount} completed cargo runs
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-sand-border pb-3">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'available'
              ? 'bg-ethio-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          Available Cargo Jobs ({availableJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('my-jobs')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'my-jobs'
              ? 'bg-ethio-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          My Active Assignments ({myJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'fleet'
              ? 'bg-ethio-700 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-sand-border hover:bg-slate-50'
          }`}
        >
          Fleet Vehicles ({user?.transporterProfile?.vehicles?.length || 2})
        </button>
      </div>

      {/* TAB 1: AVAILABLE CARGO JOBS */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableJobs.length === 0 ? (
              <div className="col-span-2 bg-white rounded-3xl p-12 text-center text-xs text-slate-500 border border-sand-border">
                No unclaimed delivery jobs currently available. Check back shortly as new orders arrive!
              </div>
            ) : (
              availableJobs.map((del) => (
                <div key={del.id} className="bg-white rounded-3xl border border-sand-border p-6 shadow-card space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-ethio-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        #{del.deliveryNumber}
                      </span>
                      <span className="text-base font-extrabold text-ethio-950">
                        Fee: ETB {del.deliveryFee.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-sand-subtle space-y-2 text-xs text-slate-700">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-slate-900">Pickup: {del.pickupCity}, {del.pickupRegion}</strong>
                          <span className="text-slate-500 text-[11px]">{del.pickupAddress}</span>
                        </div>
                      </div>