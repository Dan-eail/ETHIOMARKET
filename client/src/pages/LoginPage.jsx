import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSafeRedirectUrl, getDefaultDashboardForRole } from '../utils/redirect'
import { Sprout, ArrowRight, AlertCircle, ShieldCheck, Lock } from 'lucide-react'

export const LoginPage = () => {
  const { login, demoSwitch } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectParam = searchParams.get('redirect')

  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resolveDestination = (userObj, roleOverride = null) => {
    const primaryRole = roleOverride || userObj?.roles?.find(r => r.isPrimary)?.role || userObj?.roles?.[0]?.role || 'BUYER'
    const safeTarget = getSafeRedirectUrl(redirectParam)
    if (safeTarget && safeTarget !== '/login' && safeTarget !== '/register') {
      return safeTarget
    }
    return getDefaultDashboardForRole(primaryRole)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const loggedUser = await login({ emailOrPhone, password })
      navigate(resolveDestination(loggedUser))
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDemo = async (role) => {
    setLoading(true)
    try {
      const loggedUser = await demoSwitch(role)
      navigate(resolveDestination(loggedUser, role))
    } catch {
      setError('Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-sand-border shadow-float">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group">
            <div className="w-12 h-12 rounded-2xl bg-ethio-700 text-white flex items-center justify-center mx-auto shadow-md group-hover:bg-ethio-800 transition-colors">
              <Sprout className="w-7 h-7" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-ethio-950">
            Sign in to EthioMarket
          </h2>
          <p className="text-xs text-slate-500">
            Access your agricultural workspace, orders, and protected marketplace tools
          </p>
        </div>

        {/* Redirect Notice if user was redirected from a protected action */}
        {redirectParam && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Sign in to access your requested marketplace destination.</span>
          </div>
        )}

        {/* Demo Fast Login Pills */}
        <div className="p-4 rounded-2xl bg-sand-subtle border border-sand-border space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
            ⚡ Quick 1-Click Demo Evaluation
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('FARMER')}
              className="py-2 px-3 rounded-xl bg-white border border-sand-border text-xs font-bold text-ethio-800 hover:bg-emerald-50 transition-colors shadow-sm"
            >
              🌱 Farmer (Abebe)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('BUYER')}
              className="py-2 px-3 rounded-xl bg-white border border-sand-border text-xs font-bold text-amber-800 hover:bg-amber-50 transition-colors shadow-sm"
            >
              💼 Buyer (Almaz)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('TRANSPORTER')}
              className="py-2 px-3 rounded-xl bg-white border border-sand-border text-xs font-bold text-blue-800 hover:bg-blue-50 transition-colors shadow-sm"
            >
              🚚 Transporter (Kebede)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="py-2 px-3 rounded-xl bg-white border border-sand-border text-xs font-bold text-purple-800 hover:bg-purple-50 transition-colors shadow-sm"
            >
              🛡️ Administrator
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address or Phone (+251...)
            </label>
            <input
              type="text"
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="e.g. buyer@ethiomarket.et"
              className="w-full px-4 py-2.5 rounded-2xl bg-sand-bg border border-sand-border text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-ethio-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-2xl bg-sand-bg border border-sand-border text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-ethio-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link
              to={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
              className="font-bold text-ethio-700 hover:text-ethio-900"
            >
              Create Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
