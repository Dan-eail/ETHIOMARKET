import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Fingerprint,
  Lock
} from 'lucide-react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { getDefaultDashboardForRole } from '../../utils/redirect'

export const FaydaCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // 1. Check for provider error or citizen cancellation
    if (errorParam) {
      setError(errorDesc || `Fayda authentication was not completed (${errorParam}).`)
      setLoading(false)
      return
    }

    // 2. Validate essential OAuth2 parameters
    if (!state) {
      setError('Missing verification session state parameter. Verification session is invalid or expired.')
      setLoading(false)
      return
    }

    if (!code) {
      setError('Missing authorization code from Fayda identity provider.')
      setLoading(false)
      return
    }

    finalizeFaydaVerification()
  }, [code, state, errorParam, errorDesc])

  const finalizeFaydaVerification = async () => {
    setLoading(true)
    setError('')
    try {
      // Exchange authorization code for authenticated identity on backend
      const res = await api.verifyFaydaCallback({
        code,
        state
      })

      setResult(res)

      // Refresh Auth Context to update isVerified badge across app
      if (typeof refreshUser === 'function') {
        await refreshUser()
      }
    } catch (err) {
      setError(err.message || 'Failed to validate Fayda identity verification callback.')
    } finally {
      setLoading(false)
    }
  }

  const primaryRole = user?.roles?.find(r => r.isPrimary)?.role || user?.roles?.[0]?.role || 'FARMER'
  const dashboardUrl = getDefaultDashboardForRole(primaryRole)

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-sand-border shadow-float p-6 sm:p-8 text-center space-y-6">
        {loading ? (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Validating National ID</h2>
              <p className="text-xs text-slate-500 mt-1">
                EthioMarket is performing cryptographic verification of your Fayda OIDC credentials...
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Security Protocol in Progress</span>
              </div>
              <p>• Validating high-entropy state and anti-replay nonce</p>
              <p>• Exchanging PKCE code_verifier with Fayda token endpoint</p>
              <p>• Checking national registry claims without storing raw biometric data</p>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Verification Incomplete</h2>
              <p className="text-xs text-rose-700 mt-2 p-3 bg-rose-50 rounded-2xl border border-rose-200">
                {error}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to={dashboardUrl}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100/80 px-2.5 py-1 rounded-full">
                Fayda Authenticated
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">Identity Verified Successfully</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your Ethiopian National ID has been cryptographically authenticated via Fayda e-KYC.
              </p>
            </div>

            {result?.verificationRecord && (
              <div className="p-4 rounded-2xl bg-sand-bg border border-sand-border text-left text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified Citizen:</span>
                  <span className="font-bold text-slate-900">{result.verificationRecord.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-bold text-emerald-800">Fayda National e-KYC (eSignet)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => navigate(dashboardUrl)}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Continue to Your Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
