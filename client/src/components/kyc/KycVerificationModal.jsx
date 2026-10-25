import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Fingerprint,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  UploadCloud,
  X,
  ExternalLink,
  Info,
  Lock
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export const KycVerificationModal = ({ isOpen, onClose, onVerificationSuccess }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('fayda') // 'fayda' or 'manual'
  const [loading, setLoading] = useState(false)
  const [kycStatus, setKycStatus] = useState(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Fayda State
  const [faydaConsent, setFaydaConsent] = useState(false)
  const [faydaSession, setFaydaSession] = useState(null)

  // Manual Review State
  const [docType, setDocType] = useState('KEBELE_ID')
  const [docNumber, setDocNumber] = useState('')
  const [userNotes, setUserNotes] = useState('')
  const [manualConsent, setManualConsent] = useState(false)
  const [fileData, setFileData] = useState(null) // { base64, fileName, mimeType, size }

  useEffect(() => {
    if (isOpen) {
      loadKycStatus()
    }
  }, [isOpen])

  const loadKycStatus = async () => {
    try {
      setLoading(true)
      const data = await api.getKycStatus()
      setKycStatus(data)
    } catch (err) {
      setError(err.message || 'Failed to load identity verification status.')
    } finally {
      setLoading(false)
    }
  }

  const handleInitiateFayda = async () => {
    if (!faydaConsent) {
      setError('You must grant explicit consent to initiate Fayda National ID verification.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await api.initiateFayda({ consentGiven: true })
      setFaydaSession(res)
      if (res.authUrl) {
        window.location.href = res.authUrl
      } else {
        setSuccessMsg(res.message || 'Fayda session initiated in sandbox mode.')
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate Fayda session.')
    } finally {
      setLoading(false)
    }
  }

  const handleSimulateFaydaTestCallback = async () => {
    if (!faydaSession?.state) return
    setLoading(true)
    setError('')
    try {
      const res = await api.verifyFaydaCallback({
        state: faydaSession.state,
        code: 'TEST_AUTH_CODE_' + Date.now(),
        mockClaims: {
          fullName: user?.name || 'Verified Ethiopian Citizen',
          gender: 'MALE',
          dateOfBirth: '1988-06-12',
          faydaId: 'FIN-' + Math.floor(100000000000 + Math.random() * 900000000000)
        }
      })
      setSuccessMsg('Fayda identity verified successfully! Your account is now verified.')
      await loadKycStatus()
      if (onVerificationSuccess) onVerificationSuccess(res)
    } catch (err) {
      setError(err.message || 'Fayda test callback failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFileData({
        base64: reader.result,
        fileName: file.name,
        mimeType: file.type,
        size: file.size
      })
      setError('')