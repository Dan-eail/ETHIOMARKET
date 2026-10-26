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