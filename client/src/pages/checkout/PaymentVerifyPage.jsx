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
              <h2 className="text-xl font-bold text-slate-900">Payment Not Confirmed</h2>
              <p className="text-xs text-rose-600 mt-1 leading-relaxed">{error}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 border border-slate-200 text-left space-y-1">
              <div>Reference: <strong className="font-mono">{tx_ref}</strong></div>
              <div>Status: <strong>Unconfirmed</strong></div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={verifyTransaction}
                className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Verification</span>
              </button>
              <Link
                to="/dashboard/buyer"
                className="w-full py-3 rounded-2xl border border-sand-border text-slate-700 font-bold text-xs hover:bg-sand-bg transition-colors"
              >
                Return to Orders
              </Link>
            </div>
          </div>
        ) : result?.verified ? (
          <div className="space-y-4 py-2">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-300 shadow-md shadow-emerald-600/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">Payment Successful!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your payment into EthioMarket's merchant account has been verified.
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="p-4 bg-sand-bg/70 rounded-2xl border border-sand-border text-xs text-slate-700 text-left space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-sand-border">
                <span className="text-slate-500">Order Number</span>
                <span className="font-bold text-slate-900 font-mono">
                  #{result.order?.orderNumber || 'ORD-CONFIRMED'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Verified Amount</span>
                <span className="font-bold text-emerald-800 text-sm">
                  ETB {result.payment?.amount?.toLocaleString() || result.order?.totalAmount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Merchant Reference</span>
                <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]">
                  {result.payment?.merchantReference}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Provider Ref</span>
                <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]">
                  {result.payment?.providerReference || 'CHAPA-ETB-VERIFIED'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-sand-border">
                <span className="text-slate-500">Order Fulfillment Status</span>
                <span className="font-bold text-emerald-700 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100">
                  {result.order?.status || 'CONFIRMED'}
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Link
                to="/dashboard/buyer"
                className="w-full py-3 px-4 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>View Order in Buyer Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Payment Pending Confirmation</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your payment was received by the payment processor and is pending final settlement.
              </p>
            </div>
            <button
              onClick={verifyTransaction}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check Status Again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
export default PaymentVerifyPage
