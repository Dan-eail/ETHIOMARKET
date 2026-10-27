import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ShoppingBag
} from 'lucide-react'
import { api } from '../../services/api'

export const PaymentVerifyPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tx_ref = searchParams.get('tx_ref')

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tx_ref) {
      setError('No transaction reference found in return URL.')
      setLoading(false)
      return
    }

    verifyTransaction()
  }, [tx_ref])

  const verifyTransaction = async () => {
    setLoading(true)
    setError('')
    try {
      // Call EthioMarket server to verify with Chapa provider
      const data = await api.verifyPayment(tx_ref)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Payment verification could not be confirmed with Chapa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-sand-border shadow-float p-6 sm:p-8 text-center space-y-6">
        {loading ? (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Verifying Payment</h2>
              <p className="text-xs text-slate-500 mt-1">
                EthioMarket is performing server-side reconciliation with Chapa...
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-400 bg-slate-50 py-1.5 px-3 rounded-lg border inline-block">
              Ref: {tx_ref}
            </div>
          </div>
        ) : error ? (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>