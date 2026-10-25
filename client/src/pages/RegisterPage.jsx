import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSafeRedirectUrl, getDefaultDashboardForRole } from '../utils/redirect'
import { Sprout, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react'

export const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const roleParam = searchParams.get('role')?.toUpperCase()
  const initialRole = ['FARMER', 'BUYER', 'TRANSPORTER'].includes(roleParam) ? roleParam : 'FARMER'
  const redirectParam = searchParams.get('redirect')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: initialRole,
    farmName: '',
    businessName: '',
    companyName: '',
    region: 'Oromia',
    city: 'Meki',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (roleParam && ['FARMER', 'BUYER', 'TRANSPORTER'].includes(roleParam)) {
      setForm(prev => ({ ...prev, role: roleParam }))
    }
  }, [roleParam])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const newUser = await register(form)
      const safeTarget = getSafeRedirectUrl(redirectParam)
      if (safeTarget && safeTarget !== '/login' && safeTarget !== '/register') {
        navigate(safeTarget)
      } else {
        navigate(getDefaultDashboardForRole(form.role))
      }
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-3xl border border-sand-border shadow-float">
        
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group">
            <div className="w-12 h-12 rounded-2xl bg-ethio-700 text-white flex items-center justify-center mx-auto shadow-md group-hover:bg-ethio-800 transition-colors">
              <Sprout className="w-7 h-7" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-ethio-950">
            Create an EthioMarket Account
          </h2>
          <p className="text-xs text-slate-500">
            Select your primary role to access dedicated marketplace tools
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              I am joining as a:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'FARMER', label: 'Farmer / Producer' },
                { role: 'BUYER', label: 'Commercial Buyer' },
                { role: 'TRANSPORTER', label: 'Transporter' },
              ].map(r => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.role })}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                    form.role === r.role
                      ? 'border-ethio-700 bg-emerald-50 text-ethio-800 ring-2 ring-ethio-600/20'
                      : 'border-sand-border bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Abebe Bikila"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="abebe@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ethiopian Phone Number</label>
              <input
                type="text"
                required
                placeholder="+251911..."
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Role specific profile names */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {form.role === 'FARMER' ? 'Farm / Cooperative Name' :
               form.role === 'BUYER' ? 'Business or Company Name' :
               'Transport / Haulage Enterprise Name'}
            </label>
            <input
              type="text"
              placeholder={
                form.role === 'FARMER' ? 'e.g. Rift Valley Organic Agro' :
                form.role === 'BUYER' ? 'e.g. Addis Fresh Distributors' :
                'e.g. Abyssinia Fast Cargo'
              }
              value={form.farmName || form.businessName || form.companyName}
              onChange={(e) => {
                if (form.role === 'FARMER') setForm({ ...form, farmName: e.target.value })
                else if (form.role === 'BUYER') setForm({ ...form, businessName: e.target.value })
                else setForm({ ...form, companyName: e.target.value })
              }}
              className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Region</label>
              <input
                type="text"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / Woreda</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-sand-border text-xs focus:ring-2 focus:ring-ethio-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <span>Creating Account...</span> : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link
            to={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
            className="font-bold text-ethio-700 hover:underline"
          >
            Sign in here
          </Link>
        </div>

      </div>
    </div>
  )
}
