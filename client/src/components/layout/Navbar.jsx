import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import {
  Sprout,
  Search,
  Globe,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Truck,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Menu,
  X,
  PlusCircle,
  TrendingUp,
  UserPlus,
  LogIn,
  Layers,
  HelpCircle
} from 'lucide-react'

// Role-tailored header configuration dictionary
const ROLE_CONFIGS = {
  FARMER: {
    portalBadge: 'Farmer Portal',
    portalBadgeAm: 'አምራች ገበሬ ፖርታል',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    roleTagBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    indicatorColor: 'bg-emerald-500',
    tickerBadge: '🌾 Harvest & Market Pulse',
    tickerBadgeAm: '🌾 የሰብልና ገበያ ዜና',
    tickerText: 'ECX Price Alert: Red Teff +4.2% in Addis Ababa · White Wheat steady in Bale · High demand for Meki Red Onions',
    tickerTextAm: 'የኢትዮጵያ ምርት ገበያ: ሰርገኛ ጤፍ +4.2% በአዲስ አበባ · ነጭ ስንዴ በባሌ የተረጋጋ · በመቂ ቀይ ሽንኩርት ከፍተኛ የገዢ ፍላጎት',
    searchPlaceholder: 'Search your crop listings, batch ID, or buyer quote...',
    searchPlaceholderAm: 'የእርስዎን የሰብል ዝርዝሮች፣ መለያ ቁጥር ወይም የዋጋ ጥያቄ ይፈልጉ...',
    dashboardUrl: '/dashboard/farmer',
    workspaceLabel: 'Farmer Dashboard',
    workspaceLabelAm: 'የገበሬ የስራ ገጽ',
    primaryIcon: Sprout,
    buttonClass: 'bg-ethio-700 hover:bg-ethio-800 text-white shadow-sm',
  },
  BUYER: {
    portalBadge: 'Commercial Buyer',
    portalBadgeAm: 'የንግድ ገዢ ፖርታል',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    roleTagBg: 'bg-blue-50 text-blue-800 border-blue-200',
    indicatorColor: 'bg-blue-500',
    tickerBadge: '🛡️ Escrow Protected',
    tickerBadgeAm: '🛡️ አስተማማኝ የክፍያ ዋስትና',
    tickerText: 'Direct farm sourcing with verified regional transporters & secure Telebirr / CBE Birr escrow settlements',
    tickerTextAm: 'ቀጥታ ከገበሬዎች የተረጋገጠ ምርት ግዢ ከተረጋገጡ አጓጓዦችና በቴሌብር/ሲቢኢ አስተማማኝ የክፍያ ዋስትና ጋር',
    searchPlaceholder: 'Search fresh onions, red teff, Sidama coffee, garlic...',
    searchPlaceholderAm: 'ቀይ ሽንኩርት፣ ጤፍ፣ የሲዳማ ቡና፣ ነጭ ሽንኩርት ፈልግ...',
    dashboardUrl: '/dashboard/buyer',
    workspaceLabel: 'Buyer Dashboard',
    workspaceLabelAm: 'የገዢ የስራ ገጽ',
    primaryIcon: ShoppingBag,
    buttonClass: 'bg-blue-700 hover:bg-blue-800 text-white shadow-sm',
  },
  TRANSPORTER: {
    portalBadge: 'Logistics Dispatch',
    portalBadgeAm: 'የጭነትና ትራንስፖርት ፖርታል',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    roleTagBg: 'bg-amber-50 text-amber-900 border-amber-200',
    indicatorColor: 'bg-amber-500',
    tickerBadge: '🚛 Haulage Dispatch',
    tickerBadgeAm: '🚛 የጭነት ስምሪት',
    tickerText: 'Live Regional Corridor: 14 agricultural loads ready for pickup in Ambo, Hawassa & East Shewa depots',
    tickerTextAm: 'የቀጥታ የትራንስፖርት ኮሪደር: 14 የግብርና ጭነቶች በአምቦ፣ ሀዋሳ እና ምስራቅ ሸዋ መጋዘኖች ተዘጋጅተዋል',
    searchPlaceholder: 'Search available cargo routes, Modjo corridor, waybill #...',
    searchPlaceholderAm: 'የጭነት መስመሮች፣ የሞጆ ኮሪደር፣ የመንገድ ፈቃድ ፈልግ...',
    dashboardUrl: '/dashboard/transporter',
    workspaceLabel: 'Transporter Fleet',
    workspaceLabelAm: 'የትራንስፖርት የስራ ገጽ',
    primaryIcon: Truck,
    buttonClass: 'bg-amber-700 hover:bg-amber-800 text-white shadow-sm',
  },
  ADMIN: {
    portalBadge: 'Platform Admin',
    portalBadgeAm: 'የቁጥጥርና ኦዲት ማዕከል',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    roleTagBg: 'bg-purple-50 text-purple-900 border-purple-200',
    indicatorColor: 'bg-purple-500',
    tickerBadge: '⚡ Platform Oversight',
    tickerBadgeAm: '⚡ የስርዓቱ ኦዲትና ቁጥጥር',
    tickerText: 'Marketplace Health 99.98% · 4 farmer cooperative KYC audits pending · Escrow settlements nominal',
    tickerTextAm: 'የስርዓቱ ጤናማነት 99.98% · 4 የአምራቾች ህብረት ስራ ማረጋገጫ በመጠባበቅ ላይ · የክፍያ ሂደት መደበኛ',
    searchPlaceholder: 'Search user TIN, cooperative license, order #, audit log...',
    searchPlaceholderAm: 'የተጠቃሚ ታክስ መለያ፣ የህብረት ስራ ፈቃድ፣ የትዕዛዝ ቁጥር ፈልግ...',
    dashboardUrl: '/dashboard/admin',
    workspaceLabel: 'Admin Console',
    workspaceLabelAm: 'የአስተዳዳሪ ክፍል',
    primaryIcon: ShieldCheck,
    buttonClass: 'bg-purple-800 hover:bg-purple-900 text-white shadow-sm',
  },
}

// Fallback guest configuration for landing page
const GUEST_CONFIG = {
  portalBadge: 'Agri-Exchange Ethiopia',
  portalBadgeAm: 'የግብርና ምርት ልውውጥ',
  badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  roleTagBg: 'bg-sand-subtle text-slate-700 border-sand-border',
  indicatorColor: 'bg-emerald-500',
  tickerBadge: '🇪🇹 EthioMarket Exchange',
  tickerBadgeAm: '🇪🇹 የኢትዮማርኬት ልውውጥ',
  tickerText: 'Ethiopia’s Shared Agricultural Marketplace: Connect farmers, wholesale buyers, and transporters with direct pricing & secure settlements',
  tickerTextAm: 'የኢትዮጵያ የጋራ የግብርና ምርቶች ልውውጥ: አምራች ገበሬዎችን፣ የጅምላ ነጋዴዎችንና አጓጓዦችን በቀጥታ ዋጋና አስተማማኝ ክፍያ ያገናኛል',
  searchPlaceholder: 'Search onions, teff, coffee, tomatoes...',
  searchPlaceholderAm: 'ቀይ ሽንኩርት፣ ጤፍ፣ ቡና፣ ቲማቲም ፈልግ...',
}

export const Navbar = () => {
  const { user, activeRole, demoSwitch, logout, isAuthenticated } = useAuth()
  const { lang, toggleLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Determine role config only when authenticated with activeRole
  const roleConfig = (isAuthenticated && activeRole && ROLE_CONFIGS[activeRole]) || GUEST_CONFIG

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      if (isAuthenticated) {
        navigate(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`)
      } else {
        navigate(`/login?redirect=${encodeURIComponent(`/marketplace?search=${encodeURIComponent(searchTerm.trim())}`)}`)
      }
      setMobileMenuOpen(false)
    }
  }

  const handleRoleChange = async (newRole) => {
    setRoleDropdownOpen(false)
    try {
      await demoSwitch(newRole)
      // Only redirect if already inside a role dashboard; on the landing page '/', keep visitor on landing page!
      if (location.pathname.startsWith('/dashboard/')) {
        if (newRole === 'FARMER') navigate('/dashboard/farmer')
        else if (newRole === 'BUYER') navigate('/dashboard/buyer')
        else if (newRole === 'TRANSPORTER') navigate('/dashboard/transporter')
        else if (newRole === 'ADMIN') navigate('/dashboard/admin')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getDashboardUrl = () => {
    if (activeRole === 'FARMER') return '/dashboard/farmer'
    if (activeRole === 'BUYER') return '/dashboard/buyer'
    if (activeRole === 'TRANSPORTER') return '/dashboard/transporter'
    if (activeRole === 'ADMIN') return '/dashboard/admin'
    return '/marketplace'
  }

  // Smooth scroll handler for landing page anchors
  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false)
    if (location.pathname === '/') {
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    navigate(`/#${sectionId}`)
  }

  const handleHomeClick = (e) => {
    setMobileMenuOpen(false)
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Navigation Links for the Shared Public Landing Page
  const publicNavLinks = [
    { label: 'Home', labelAm: 'መነሻ', action: handleHomeClick, to: '/' },
    { label: 'Explore Categories', labelAm: 'ምድቦች', action: () => scrollToSection('categories'), to: '/#categories' },
    { label: 'How It Works', labelAm: 'እንዴት ይሰራል?', action: () => scrollToSection('how-it-works'), to: '/#how-it-works' },
    { label: 'For Farmers', labelAm: 'ለገበሬዎች', action: () => scrollToSection('for-farmers'), to: '/#for-farmers' },
    { label: 'For Buyers', labelAm: 'ለገዢዎች', action: () => scrollToSection('for-buyers'), to: '/#for-buyers' },
    { label: 'For Transporters', labelAm: 'ለአጓጓዦች', action: () => scrollToSection('for-transporters'), to: '/#for-transporters' },
    { label: 'About Us', labelAm: 'ስለ እኛ', action: () => scrollToSection('about'), to: '/#about' },
  ]

  const DashboardIcon = roleConfig.primaryIcon || LayoutDashboard

  return (
    <header className="sticky top-0 z-40 bg-sand-bg/95 backdrop-blur-md border-b border-sand-border transition-colors duration-300">
      
      {/* Top Ticker Banner */}
      <div className="bg-ethio-950 text-emerald-100 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 overflow-hidden shadow-inner">
        <span className={`inline-block w-2 h-2 rounded-full ${roleConfig.indicatorColor} animate-pulse shrink-0`}></span>
        <span className="font-bold text-white/90 bg-white/10 px-2 py-0.5 rounded text-[11px] shrink-0 tracking-wide">
          {lang === 'am' ? roleConfig.tickerBadgeAm : roleConfig.tickerBadge}
        </span>
        <span className="truncate text-emerald-200/90 text-[11px] sm:text-xs">
          {lang === 'am' ? roleConfig.tickerTextAm : roleConfig.tickerText}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          
          {/* Logo with Brand Identity */}
          <Link to="/" onClick={handleHomeClick} className="flex items-center gap-3 shrink-0 group">
            <div className="w-11 h-11 rounded-2xl bg-ethio-700 text-white flex items-center justify-center shadow-md group-hover:bg-ethio-800 transition-colors">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold text-ethio-950 tracking-tight block leading-none">
                  Ethio<span className="text-ethio-600">Market</span>
                </span>
                {isAuthenticated && activeRole && (
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${roleConfig.badgeColor} hidden sm:inline-block`}>
                    {lang === 'am' ? roleConfig.portalBadgeAm : roleConfig.portalBadge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                {lang === 'am' ? 'የኢትዮጵያ የግብርና ልውውጥ' : 'Agri-Exchange Ethiopia'}
              </span>
            </div>
          </Link>

          {/* Public Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-center gap-4 text-xs lg:text-[13px] font-semibold text-slate-700">
            {publicNavLinks.map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className="hover:text-ethio-700 transition-colors py-1 cursor-pointer"
              >
                {lang === 'am' ? item.labelAm : item.label}
              </button>
            ))}
          </nav>

          {/* Right Controls: Language, Demo Switcher, Auth / Dashboard Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              title="Toggle Amharic / English"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-sand-border rounded-full hover:bg-slate-50 transition-colors shadow-sm shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-ethio-700" />
              <span>{lang === 'en' ? 'አማርኛ' : 'EN'}</span>
            </button>

            {/* Instant Role Switcher (Evaluation / Demo Mode) */}
            <div className="relative shrink-0">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-full border transition-all shadow-sm ${
                  isAuthenticated && activeRole ? roleConfig.roleTagBg : 'bg-sand-subtle text-slate-700 border-sand-border hover:bg-white'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAuthenticated && activeRole ? roleConfig.indicatorColor : 'bg-emerald-500'}`}></span>
                <span className="hidden xs:inline">Role:</span>
                <span>{isAuthenticated && activeRole ? activeRole : 'Demo Roles'}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-float border border-sand-border py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Switch Role Portal
                    </p>
                    <span className="text-[10px] text-ethio-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Demo Mode</span>
                  </div>

                  <button
                    onClick={() => handleRoleChange('FARMER')}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                      activeRole === 'FARMER' ? 'text-ethio-800 font-bold bg-emerald-50/70' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Sprout className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold">Farmer (Abebe)</div>
                        <div className="text-[10px] text-slate-400">Rift Valley Agro · Producer</div>
                      </div>
                    </div>
                    {activeRole === 'FARMER' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>

                  <button
                    onClick={() => handleRoleChange('BUYER')}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-blue-50 transition-colors ${
                      activeRole === 'BUYER' ? 'text-blue-800 font-bold bg-blue-50/70' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold">Buyer (Almaz)</div>
                        <div className="text-[10px] text-slate-400">Addis Produce Supply · Wholesale</div>
                      </div>
                    </div>
                    {activeRole === 'BUYER' && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>

                  <button
                    onClick={() => handleRoleChange('TRANSPORTER')}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-amber-50 transition-colors ${
                      activeRole === 'TRANSPORTER' ? 'text-amber-900 font-bold bg-amber-50/70' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold">Transporter (Kebede)</div>
                        <div className="text-[10px] text-slate-400">Abyssinia Cargo · Logistics Fleet</div>
                      </div>
                    </div>
                    {activeRole === 'TRANSPORTER' && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                  </button>

                  <button
                    onClick={() => handleRoleChange('ADMIN')}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-purple-50 transition-colors ${
                      activeRole === 'ADMIN' ? 'text-purple-900 font-bold bg-purple-50/70' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold">Platform Admin</div>
                        <div className="text-[10px] text-slate-400">Operations, KYC & Oversight</div>
                      </div>
                    </div>
                    {activeRole === 'ADMIN' && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
                  </button>
                </div>
              )}
            </div>

            {/* Authenticated Account Menu vs Public Sign In / Register Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* My Dashboard CTA Button */}
                <Link
                  to={getDashboardUrl()}
                  className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${roleConfig.buttonClass || 'bg-ethio-700 text-white'}`}
                >
                  <DashboardIcon className="w-3.5 h-3.5" />
                  <span>{lang === 'am' ? roleConfig.workspaceLabelAm || 'የስራ ገጽ' : roleConfig.workspaceLabel || 'My Dashboard'}</span>
                </Link>

                {/* User Profile Dropdown */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-10 h-10 rounded-full border-2 border-ethio-600 overflow-hidden flex items-center justify-center bg-white shadow-sm hover:ring-2 hover:ring-ethio-500/20 transition-all"
                  >
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-ethio-700" />
                    )}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-float border border-sand-border py-2 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${roleConfig.badgeColor}`}>
                          {activeRole} Account
                        </span>
                      </div>

                      <Link
                        to={getDashboardUrl()}
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {lang === 'am' ? roleConfig.workspaceLabelAm || 'የስራ ገጽ' : roleConfig.workspaceLabel || 'My Dashboard'}
                      </Link>

                      <Link
                        to="/marketplace"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {lang === 'am' ? 'የገበያ ካታሎግ' : 'Browse Marketplace'}
                      </Link>

                      <button
                        onClick={() => {
                          logout()
                          setUserMenuOpen(false)
                          navigate('/')
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{lang === 'am' ? 'ውጣ' : 'Log Out'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-ethio-900 border border-sand-border rounded-full hover:bg-white transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-ethio-700" />
                  <span>{lang === 'am' ? 'ግባ' : 'Sign In'}</span>
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-ethio-700 hover:bg-ethio-800 rounded-full shadow-sm transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{lang === 'am' ? 'ይመዝገቡ' : 'Get Started'}</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="xl:hidden p-2 text-slate-700 hover:text-ethio-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-sand-border space-y-3 animate-fade-in">
            {/* Navigation Links */}
            <div className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
              <div className="pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                EthioMarket Platform
              </div>

              {publicNavLinks.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  className="text-left py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  {lang === 'am' ? item.labelAm : item.label}
                </button>
              ))}

              {isAuthenticated ? (
                <Link
                  to={getDashboardUrl()}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2.5 px-3 rounded-xl text-center text-xs font-bold mt-2 ${roleConfig.buttonClass || 'bg-ethio-700 text-white'}`}
                >
                  {lang === 'am' ? roleConfig.workspaceLabelAm || 'የስራ ገጽ' : roleConfig.workspaceLabel || 'Open My Dashboard'}
                </Link>
              ) : (
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl text-center text-xs font-bold border border-sand-border bg-white text-ethio-900"
                  >
                    {lang === 'am' ? 'ግባ' : 'Sign In'}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl text-center text-xs font-bold bg-ethio-700 text-white shadow-sm"
                  >
                    {lang === 'am' ? 'ይመዝገቡ' : 'Create Account'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
