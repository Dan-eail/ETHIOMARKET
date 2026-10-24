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