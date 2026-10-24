import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Lock,
  ArrowRight,
  UserPlus,
  LogIn,
  X,
  Sparkles,
  ShieldCheck,
  Sprout,
  ShoppingBag,
  Truck
} from 'lucide-react'

export const AuthPromptModal = ({
  isOpen,
  onClose,
  title = 'Sign In to Access Marketplace Features',
  description = 'Product searching, verified wholesale pricing, supplier contact details, and quotation negotiations require an EthioMarket account.',
  targetUrl = '/marketplace'
}) => {
  const { demoSwitch } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSignIn = () => {
    onClose()
    navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`)
  }

  const handleRegister = () => {
    onClose()
    navigate(`/register?redirect=${encodeURIComponent(targetUrl)}`)
  }

  const handleQuickDemo = async (role) => {
    try {
      await demoSwitch(role)
      onClose()
      navigate(targetUrl)
    } catch (err) {
      console.error('Quick demo switch failed:', err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ethio-950/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-float border border-sand-border p-6 sm:p-8 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-ethio-800 flex items-center justify-center shadow-inner">
            <Lock className="w-7 h-7 text-ethio-700" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-subtle border border-sand-border text-[11px] font-bold text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-ethio-600" />
            <span>Protected Marketplace Feature</span>
          </div>

          <h3 id="auth-modal-title" className="text-xl sm:text-2xl font-extrabold text-ethio-950 tracking-tight">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
            {description}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleSignIn}
            className="w-full py-3 px-4 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 group"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleRegister}
            className="w-full py-3 px-4 rounded-2xl bg-white border-2 border-ethio-700 text-ethio-800 hover:bg-emerald-50/70 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* 1-Click Demo Evaluation Pills */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Instant 1-Click Demo Access</span>
            </span>
            <span className="text-[10px] text-ethio-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              Tester Fast-Track
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('BUYER')}
              className="p-2.5 rounded-xl border border-sand-border bg-sand-bg hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-900 text-xs font-bold transition-all text-center flex flex-col items-center gap-1"
            >
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Buyer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('FARMER')}
              className="p-2.5 rounded-xl border border-sand-border bg-sand-bg hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 text-xs font-bold transition-all text-center flex flex-col items-center gap-1"
            >
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>Farmer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('TRANSPORTER')}
              className="p-2.5 rounded-xl border border-sand-border bg-sand-bg hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-900 text-xs font-bold transition-all text-center flex flex-col items-center gap-1"
            >
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Transporter</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="p-2.5 rounded-xl border border-sand-border bg-sand-bg hover:bg-purple-50 hover:border-purple-300 text-slate-700 hover:text-purple-900 text-xs font-bold transition-all text-center flex flex-col items-center gap-1"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Footer Dismiss Note */}
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Continue exploring public platform details
          </button>
        </div>

      </div>
    </div>
  )
}

