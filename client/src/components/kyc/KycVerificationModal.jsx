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
  Lock,
  ArrowRight
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export const KycVerificationModal = ({ isOpen, onClose, onVerificationSuccess }) => {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('fayda') // 'fayda' or 'manual'
  const [loading, setLoading] = useState(false)
  const [kycStatus, setKycStatus] = useState(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Fayda State
  const [faydaConsent, setFaydaConsent] = useState(false)

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
      if (res.authUrl) {
        // Real-Time Redirect to official Fayda Identity Provider portal (id.gov.et)
        window.location.href = res.authUrl
      } else {
        // Not configured with active partner credentials
        setError(
          res.message ||
          'Fayda Partner credentials are unconfigured. Please complete onboarding at partner.fayda.et or submit for Manual Document Review.'
        )
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate Fayda session.')
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
    }
    reader.readAsDataURL(file)
  }

  const handleSubmitManual = async (e) => {
    e.preventDefault()
    if (!manualConsent) {
      setError('You must provide consent for manual identity processing.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.submitManualKyc({
        documentType: docType,
        documentNumber: docNumber.trim(),
        userNotes: userNotes.trim(),
        consentGiven: true,
        documentBase64: fileData?.base64,
        documentFileName: fileData?.fileName,
        documentMimeType: fileData?.mimeType
      })

      setSuccessMsg('Manual verification review submitted! An EthioMarket administrator will inspect your documentation.')
      await loadKycStatus()
      if (typeof refreshUser === 'function') {
        await refreshUser()
      }
    } catch (err) {
      setError(err.message || 'Failed to submit manual review.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const isVerified = kycStatus?.isVerified || user?.isVerified
  const currentStatus = kycStatus?.currentStatus || (isVerified ? 'VERIFIED' : 'NOT_STARTED')
  const currentMethod = kycStatus?.currentMethod || 'FAYDA'
  const isFaydaConfigured = kycStatus?.faydaConfigured

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-sand-border my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-sand-bg border-b border-sand-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">National Identity Verification</h3>
              <p className="text-xs text-slate-500">Official Fayda e-KYC & Controlled Manual Review Fallback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Verification Status Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Account Status</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isVerified
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : currentStatus === 'PENDING_REVIEW'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : currentStatus === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isVerified ? 'VERIFIED' : currentStatus}
                </span>
                {isVerified && (
                  <span className="text-[11px] text-slate-500">
                    Method: <strong className="text-slate-700">{currentMethod === 'FAYDA' ? 'Fayda National ID' : 'Manual Document Review'}</strong>
                  </span>
                )}
              </div>
            </div>

            {isVerified ? (
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>KYC Approved</span>
              </div>
            ) : currentStatus === 'PENDING_REVIEW' ? (
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
                <Clock className="w-5 h-5 animate-spin" />
                <span>Pending Review</span>
              </div>
            ) : null}
          </div>

          {isVerified ? (
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>Verified Marketplace Citizen</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your identity has been authenticated according to Ethiopian regulatory and platform integrity standards. You possess full authorized access to publish produce listings, place restricted bulk orders, and claim transport assignments.
              </p>
              {kycStatus?.latestRecord && (
                <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900 grid grid-cols-2 gap-2">
                  <div>Method: <strong>{kycStatus.latestRecord.method}</strong></div>
                  <div>Verified: <strong>{new Date(kycStatus.latestRecord.reviewedAt || kycStatus.latestRecord.createdAt).toLocaleDateString()}</strong></div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setActiveTab('fayda'); setError(''); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'fayda'
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Fingerprint className="w-4 h-4 text-emerald-600" />
                  <span>1. Official Fayda e-KYC</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('manual'); setError(''); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'manual'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>2. Manual Review Fallback</span>
                </button>
              </div>

              {activeTab === 'fayda' ? (
                /* Fayda Flow */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <Lock className="w-4 h-4 text-emerald-700" />
                      <span>Official Ethiopia National ID Program (NIDP)</span>
                    </div>
                    <p className="leading-relaxed">
                      Instant, cryptographically validated verification via Ethiopia's Fayda identity system. EthioMarket connects directly with Fayda through the OpenID Connect (eSignet) standard.
                    </p>
                  </div>

                  {/* Flow Explanation */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2.5">
                    <span className="font-bold text-slate-900 block">How Official Fayda Verification Works:</span>
                    <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-600">
                      <li>
                        <strong>Consent & Redirect:</strong> You grant consent and are redirected to the official government portal at <code className="text-emerald-800">id.gov.et/authentication</code>.
                      </li>
                      <li>
                        <strong>Official OTP Authentication:</strong> Fayda sends an OTP directly to the phone number registered in the National ID database, which you verify on Fayda's secure page.
                      </li>
                      <li>
                        <strong>Signed Assertion:</strong> Fayda returns an authorization code with cryptographic token claims directly to EthioMarket's secure backend.
                      </li>
                      <li>
                        <strong>Instant KYC Approval:</strong> Your identity is verified without storing raw biometric data or unnecessary personal information.
                      </li>
                    </ol>
                  </div>

                  {!isFaydaConfigured && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-800">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>Fayda Partner Onboarding Status</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800">
                        EthioMarket server is currently running in <strong>CONFIGURATION_REQUIRED</strong> mode. Active partner credentials from the official portal (<code className="font-mono">partner.fayda.et</code>) must be configured in the server environment.
                      </p>
                      <div className="flex items-center gap-3 pt-1">
                        <a
                          href="https://partner.fayda.et"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 underline hover:text-amber-950"
                        >
                          <span>Fayda Partner Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <span className="text-amber-400">•</span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('manual')}
                          className="text-xs font-bold text-emerald-800 hover:text-emerald-900 underline"
                        >
                          Use Manual Document Review Fallback →
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl border border-sand-border space-y-3 bg-white">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={faydaConsent}
                        onChange={(e) => setFaydaConsent(e.target.checked)}
                        className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="text-xs text-slate-700 leading-normal">
                        I hereby grant consent to EthioMarket to initiate a digital authentication session with the National ID Program (Fayda) to verify my identity for agricultural commerce according to Ethiopian Data Protection Principles.
                      </span>
                    </label>

                    <button
                      type="button"
                      disabled={loading || !faydaConsent}
                      onClick={handleInitiateFayda}
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>{loading ? 'Connecting to Fayda Portal...' : 'Proceed to Official Fayda Authentication'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Manual Review Fallback */
                <form onSubmit={handleSubmitManual} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Info className="w-4 h-4 text-amber-700" />
                      <span>Controlled Manual Verification Fallback</span>
                    </div>
                    <p className="leading-relaxed">
                      If you do not yet have digital Fayda access or your biometric session cannot complete, submit an official physical credential for compliance review by an EthioMarket administrative reviewer.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-sand-border text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                      >
                        <option value="KEBELE_ID">Resident Kebele Identification Card</option>
                        <option value="PASSPORT">Ethiopian Passport</option>
                        <option value="DRIVING_LICENSE">Federal Transport Driving License</option>
                        <option value="TRADE_REGISTRATION">Ministry of Trade Business Registration / TIN</option>
                        <option value="FARMER_ASSOCIATION_ID">Woreda Agricultural Cooperative Member ID</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Document / ID Number (Optional)</label>
                      <input
                        type="text"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder="e.g. KB-104928"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-sand-border text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Upload Document Copy (PDF, JPG, PNG - Max 5MB)</label>
                      <div className="border-2 border-dashed border-sand-border rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors">
                        <input
                          type="file"
                          id="kyc-doc-file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label htmlFor="kyc-doc-file" className="cursor-pointer space-y-1 block">
                          <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                          <span className="text-xs font-bold text-emerald-800 block">
                            {fileData ? fileData.fileName : 'Click or browse to upload credential'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {fileData ? `${Math.round(fileData.size / 1024)} KB attached` : 'Private storage, strictly audited'}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Producer Information</label>
                      <textarea
                        rows={2}
                        value={userNotes}
                        onChange={(e) => setUserNotes(e.target.value)}
                        placeholder="e.g., Regional cooperative association reference or farm details"
                        className="w-full px-3.5 py-2 rounded-xl border border-sand-border text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={manualConsent}
                        onChange={(e) => setManualConsent(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="text-[11px] text-slate-600">
                        I confirm that the submitted information is authentic and consent to administrative verification review by EthioMarket compliance personnel.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={loading || !manualConsent}
                      className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{loading ? 'Submitting Review...' : 'Submit Credentials for Manual Review'}</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-sand-bg border-t border-sand-border flex items-center justify-between text-[11px] text-slate-500">
          <span>Protected under Ethiopian Data Protection Principles</span>
          <button onClick={onClose} className="font-bold text-slate-700 hover:text-slate-900">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
