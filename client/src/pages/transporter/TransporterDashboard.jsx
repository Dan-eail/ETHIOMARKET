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

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-slate-900">Destination: {del.dropoffCity}, {del.dropoffRegion}</strong>
                          <span className="text-slate-500 text-[11px]">{del.dropoffAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Cargo: ~{del.cargoWeightQuintals} Quintals</span>
                      <span>Est. Distance: {del.distanceKm || 50} km</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClaimJob(del.id)}
                    className="w-full py-3 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Claim Delivery Assignment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY JOBS */}
      {activeTab === 'my-jobs' && (
        <div className="bg-white rounded-3xl border border-sand-border shadow-card overflow-hidden divide-y divide-slate-100">
          {myJobs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              You haven't claimed any delivery assignments yet. Browse the "Available Cargo Jobs" tab!
            </div>
          ) : (
            myJobs.map((job) => (
              <div key={job.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md">
                        #{job.deliveryNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Route: {job.pickupCity} → {job.dropoffCity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Recipient: {job.recipientName} ({job.recipientPhone})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                      {job.status}
                    </span>
                    <span className="text-xs font-extrabold text-ethio-950">
                      ETB {job.deliveryFee.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Cargo Security & Verification Status */}
                <div className="p-3 rounded-2xl bg-sand-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">Cargo Seal:</span>
                    <strong className="font-mono text-slate-800">{job.cargoSealNumber || 'ET-SEAL-8921'}</strong>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      job.isPickupVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <ShieldCheck className="w-3 h-3" />
                      {job.isPickupVerified ? 'Pickup Verified' : 'Pickup Pending'}
                    </span>

                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      job.isDeliveryVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {job.isDeliveryVerified ? 'Delivery Verified' : 'Delivery Pending'}
                    </span>
                  </div>
                </div>

                {job.reportedDelayReason && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Active Delay Notice:</strong> {job.reportedDelayReason}</span>
                  </div>
                )}

                {/* Progress actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 mr-2">Fulfillment Actions:</span>
                  
                  {job.status === 'ASSIGNED' && (
                    <button
                      onClick={() => { setPickupModalDelivery(job); setPickupCodeInput(''); }}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authenticate Farm Pickup (Enter Code)</span>
                    </button>
                  )}

                  {job.status === 'PICKED_UP' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleUpdateStatus(job.id, 'IN_TRANSIT', 'Vehicle departed farm depot, entered expressway', job.pickupCity)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                      >
                        Start Highway Transit
                      </button>
                      <button
                        onClick={() => { setDelayModalDelivery(job); setDelayReason(''); setDelayLocation(''); }}
                        className="px-3.5 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Report Traffic / Delay Notice
                      </button>
                    </div>
                  )}

                  {job.status === 'IN_TRANSIT' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => { setDeliveryModalDelivery(job); setDeliveryCodeInput(''); }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Authenticate Customer Delivery (Enter Code)</span>
                      </button>
                      <button
                        onClick={() => { setDelayModalDelivery(job); setDelayReason(''); setDelayLocation(''); }}
                        className="px-3.5 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Report Road Incident
                      </button>
                    </div>
                  )}

                  {job.status === 'DELIVERED' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Delivery Authenticated & Payout Released</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: FLEET VEHICLES */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-sand-border p-6 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 bg-sand-subtle px-3 py-1 rounded-full">
                Plate: 3-A48291-AA
              </span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Verified
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900">Isuzu Medium Haulage Cargo</h4>
            <div className="text-xs text-slate-500 space-y-1">
              <p>Capacity: <strong>8.5 Metric Tons</strong> (~85 Quintals)</p>
              <p>Model Year: 2022 · Enclosed Dry Van Body</p>
              <p className="text-emerald-700 font-semibold">Active & Eligible for Bulk Grain / Coffee Runs</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-sand-border p-6 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 bg-sand-subtle px-3 py-1 rounded-full">
                Plate: 3-B19283-AA
              </span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                Verified
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900">Toyota Hilux Rapid Pickup</h4>
            <div className="text-xs text-slate-500 space-y-1">
              <p>Capacity: <strong>2.0 Metric Tons</strong> (~20 Quintals)</p>
              <p>Model Year: 2023 · Heavy Duty 4WD</p>
              <p className="text-emerald-700 font-semibold">Ideal for High-Value Avocados & Specialty Produce</p>
            </div>
          </div>
        </div>
      )}

      {/* VEHICLE REGISTRATION MODAL */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-float border border-sand-border my-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Register Transport Vehicle</h3>
              <button onClick={() => setVehicleModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleRegisterVehicle} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="3-C99882-AA"
                  value={vehicleForm.plateNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
                  >
                    <option value="PICKUP">Pickup (1-2t)</option>
                    <option value="ISUZU">Isuzu (5-8.5t)</option>
                    <option value="FSR">FSR (10-14t)</option>
                    <option value="TRAILER">Trailer (30t+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Capacity (Tons)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={vehicleForm.capacityTons}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, capacityTons: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-ethio-700 text-white text-xs font-bold shadow-sm"
                >
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PICKUP VERIFICATION MODAL */}
      {pickupModalDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-float border border-sand-border my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Verify Farm Cargo Pickup</h3>
                <p className="text-xs text-slate-500">Delivery #{pickupModalDelivery.deliveryNumber}</p>
              </div>
              <button
                onClick={() => setPickupModalDelivery(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyPickupSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                Ask the farmer at the depot for their <strong>6-digit pickup verification code</strong>. Entering it certifies the cargo has been inspected and loaded onto your vehicle.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit Farm Pickup Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  placeholder="e.g. 849201"
                  value={pickupCodeInput}
                  onChange={(e) => setPickupCodeInput(e.target.value)}
                  className="w-full text-center tracking-widest text-lg font-mono font-bold px-4 py-3 rounded-2xl border border-sand-border focus:ring-2 focus:ring-ethio-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPickupModalDelivery(null)}
                  className="px-4 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-ethio-700 hover:bg-ethio-800 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Authenticate Pickup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELIVERY VERIFICATION MODAL */}
      {deliveryModalDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-float border border-sand-border my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Verify Customer Delivery Handover</h3>
                <p className="text-xs text-slate-500">Recipient: {deliveryModalDelivery.recipientName}</p>
              </div>
              <button
                onClick={() => setDeliveryModalDelivery(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyDeliverySubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                Ask the recipient / buyer for their <strong>6-digit delivery handover code</strong> once cargo is safely offloaded. This immediately releases your transport payment!
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit Delivery Handover Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  required
                  placeholder="e.g. 592819"
                  value={deliveryCodeInput}
                  onChange={(e) => setDeliveryCodeInput(e.target.value)}
                  className="w-full text-center tracking-widest text-lg font-mono font-bold px-4 py-3 rounded-2xl border border-sand-border focus:ring-2 focus:ring-ethio-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveryModalDelivery(null)}
                  className="px-4 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Confirm Handover & Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELAY / TRANSIT NOTICE MODAL */}
      {delayModalDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-float border border-sand-border my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Log Transit Delay Notice</h3>
                <p className="text-xs text-slate-500">Notifies the customer & marketplace operations</p>
              </div>
              <button
                onClick={() => setDelayModalDelivery(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportDelaySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modjo Expressway Toll Plaza"
                  value={delayLocation}
                  onChange={(e) => setDelayLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Delay</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Weigh-scale congestion / police checkpoint inspection / heavy rain near Bishoftu"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDelayModalDelivery(null)}
                  className="px-4 py-2 rounded-xl border border-sand-border text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
                >
                  Submit Notice
                </button>
              </div>
            </form>
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
