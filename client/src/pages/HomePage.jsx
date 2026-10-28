import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { AuthPromptModal } from '../components/auth/AuthPromptModal'
import {
  Sprout,
  Search,
  ShieldCheck,
  Truck,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Users,
  Wheat,
  Coffee,
  Carrot,
  Apple,
  Sparkles,
  ChevronDown,
  Layers,
  FileText,
  BadgeCheck,
  ShoppingBag,
  HelpCircle,
  Lock,
  ArrowUpRight,
  Scale,
  CreditCard,
  Building,
  Eye
} from 'lucide-react'

// Default public categories with high quality imagery
const PUBLIC_CATEGORIES = [
  {
    id: 'grains-cereals',
    slug: 'grains-cereals',
    name: 'Cereals & Grains',
    nameAm: 'ጤፍና እህሎች',
    cropExamples: "Ada'a White Teff, Bale Wheat, Maize, Barley",
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
    icon: Wheat
  },
  {
    id: 'coffee-cash-crops',
    slug: 'coffee-cash-crops',
    name: 'Specialty Coffee',
    nameAm: 'የኢትዮጵያ ቡና',
    cropExamples: 'Sidama Washed, Yirgacheffe G1, Guji Natural, Harar',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
    icon: Coffee
  },
  {
    id: 'vegetables',
    slug: 'vegetables',
    name: 'Fresh Vegetables',
    nameAm: 'ትኩስ አትክልት',
    cropExamples: 'Meki Red Onions, Roma Tomatoes, Bale Garlic, Cabbage',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
    icon: Carrot
  },
  {
    id: 'fruits',
    slug: 'fruits',
    name: 'Fresh Fruits',
    nameAm: 'ትኩስ ፍራፍሬዎች',
    cropExamples: 'Hawassa Hass Avocados, Papayas, Arba Minch Bananas',
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&auto=format&fit=crop&q=80',
    icon: Apple
  },
  {
    id: 'pulses-oilseeds',
    slug: 'pulses-oilseeds',
    name: 'Pulses & Oilseeds',
    nameAm: 'ጥራጥሬና ቅባት እህሎች',
    cropExamples: 'Humera White Sesame, Chickpeas, Red Kidney Beans',
    imageUrl: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&auto=format&fit=crop&q=80',
    icon: Sprout
  },
  {
    id: 'spices-honey',
    slug: 'spices-honey',
    name: 'Spices & Natural Honey',
    nameAm: 'ቅመማ ቅመም እና ማር',
    cropExamples: 'Maji White Honey, Ethiopian Ginger, Cardamom, Berbere',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
    icon: Sparkles
  }
]

export const HomePage = () => {
  const { user, isAuthenticated, activeRole } = useAuth()
  const { lang, t } = useLanguage()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [previewProducts, setPreviewProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Auth prompt dialog state for protected actions
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [authPromptConfig, setAuthPromptConfig] = useState({
    title: 'Sign In to Access Marketplace Features',
    description: 'Product searching, verified wholesale pricing, supplier contact details, and quotation negotiations require an EthioMarket account.',
    targetUrl: '/marketplace'
  })

  // Hero interactive state
  const [heroSearchInput, setHeroSearchInput] = useState('')
  const [heroRegion, setHeroRegion] = useState('all')
  const [heroSlide, setHeroSlide] = useState(0)

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  // Switch hero image every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide(prev => (prev === 0 ? 1 : 0))
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  // Load public preview data
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.getCategories().catch(() => ({ categories: [] })),
          api.getProducts({ limit: 6 }).catch(() => ({ products: [] }))
        ])
        if (catRes?.categories && catRes.categories.length > 0) {
          setCategories(catRes.categories)
        } else {
          setCategories(PUBLIC_CATEGORIES)
        }
        setPreviewProducts(prodRes?.products || [])
      } catch (err) {
        console.error('Failed to load public landing data:', err)
        setCategories(PUBLIC_CATEGORIES)
      } finally {
        setLoading(false)
      }
    }
    fetchPublicData()
  }, [])

  // Trigger protected action prompt with specific context and destination
  const triggerAuthPrompt = (targetUrl, title, description) => {
    if (isAuthenticated) {
      navigate(targetUrl)
    } else {
      setAuthPromptConfig({
        targetUrl,
        title: title || 'Sign In to Access Marketplace Features',
        description: description || 'Product searching, verified wholesale pricing, and supplier negotiations require an EthioMarket account.'
      })
      setAuthPromptOpen(true)
    }
  }

  // Hero Search Submission
  const handleHeroSearch = (e) => {
    e.preventDefault()
    const query = heroSearchInput.trim()
    const params = new URLSearchParams()
    if (query) params.append('search', query)
    if (heroRegion !== 'all') params.append('region', heroRegion)
    const targetUrl = `/marketplace${params.toString() ? `?${params.toString()}` : ''}`

    if (isAuthenticated) {
      navigate(targetUrl)
    } else {
      triggerAuthPrompt(
        targetUrl,
        query ? `Sign In to Search for "${query}"` : 'Sign In to Search Ethiopian Produce',
        'Direct product searching, wholesale price filtering, and regional availability matching are reserved for registered EthioMarket accounts.'
      )
    }
  }

  const faqItems = [
    {
      q: 'What is EthioMarket?',
      a: 'EthioMarket is an agricultural exchange platform engineered specifically for Ethiopia. It brings smallholders, commercial farms, wholesale buyers, and regional transporters together into one transparent ecosystem, supporting ETB pricing and standard Ethiopian measurement units (Quintals, Kilograms, Crates, and Sacks).'
    },
    {
      q: 'Who can use the platform?',
      a: 'EthioMarket serves four distinct participant groups: (1) Farmers and agricultural cooperatives wanting to sell harvests at fair prices; (2) Commercial and institutional buyers seeking direct farm sourcing without intermediary markups; (3) Logistics providers and truck owners seeking cargo haulage jobs; and (4) Platform administrators maintaining market integrity and verifying user credentials.'
    },
    {
      q: 'How can farmers list products?',
      a: 'After creating a free Farmer account, producers can access their dedicated Farmer Workspace. There, they can list crop varieties, specify harvest dates, set minimum order quantities, input available stock in Quintals or Kilograms, specify farm-gate ETB prices, and receive direct buyer quotation requests.'
    },
    {
      q: 'How can buyers discover products?',
      a: 'Registered commercial buyers can search the marketplace catalog, filter by Ethiopian agricultural region (Oromia, Amhara, Sidama, etc.) and crop category, compare price benchmarks, submit bulk Requests for Quotation (RFQs), counter-negotiate terms, and finalize orders with Telebirr or CBE Birr settlement.'
    },
    {
      q: 'How do transporters participate?',
      a: 'Transporters register their vehicle fleet (such as Isuzu, FSR, or pickup trucks) in the Transporter Workspace. They can browse available cargo deliveries along major regional corridors (e.g. Meki to Addis Ababa, Hawassa to Merkato), claim haulage jobs, and record live milestone tracking from farm gate pickup to delivery.'
    },
    {
      q: 'Do I need an account to search for products?',
      a: 'No account is needed to explore our public landing page, learn how the platform works, or view public commodity category previews. However, to execute product searches, filter inventory, view protected seller contact details, negotiate quotations, and purchase products, you must sign in or register.'
    },
    {
      q: 'How do registration and verification work?',
      a: 'Registration is free and takes less than a minute. You choose your primary role as a Farmer, Buyer, or Transporter. To enhance marketplace trust, producers and commercial businesses can submit regional agricultural bureau credentials or trade licenses to receive official verified badges.'
    }
  ]

  return (
    <div className="space-y-24 pb-20">
      
      {/* 1. HERO SECTION */}
      <section id="hero" className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 bg-gradient-to-b from-sand-subtle/80 via-sand-bg to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines, Description, Interactive Search & Actions */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 text-ethio-800 text-xs font-extrabold border border-emerald-200 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ethiopia’s Shared Agricultural Marketplace</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ethio-950 tracking-tight leading-[1.12]">
                Connecting Ethiopia’s Agriculture to <br className="hidden sm:inline" />
                <span className="text-ethio-600 underline decoration-amber-500 decoration-wavy decoration-2">
                  Greater Opportunities.
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Discover agricultural products, connect with trusted suppliers, find transportation, and bring farmers and buyers closer together — all in one marketplace.
              </p>

              {/* Two Prominent Primary CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => triggerAuthPrompt(
                    '/marketplace',
                    'Sign In to Explore Marketplace Catalog',
                    'Direct wholesale sourcing, verified producer listings, and live price negotiations require an active EthioMarket account.'
                  )}
                  className="px-6 py-3.5 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 group"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Explore Marketplace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <Link
                  to="/register"
                  className="px-6 py-3.5 rounded-2xl bg-white border-2 border-ethio-700 text-ethio-800 hover:bg-emerald-50/70 font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-ethio-700" />
                  <span>Join EthioMarket</span>
                </Link>
              </div>

              {/* Interactive Public Search Preview Card */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-sand-border max-w-xl mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-ethio-600" />
                    <span>Search Ethiopian Harvests</span>
                  </span>
                  <span className="text-[10px] text-slate-500 bg-sand-subtle px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Sign-in required to browse results</span>
                  </span>
                </div>

                <form onSubmit={handleHeroSearch} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={heroSearchInput}
                        onChange={(e) => setHeroSearchInput(e.target.value)}
                        placeholder="e.g. Teff, Red Onions, Coffee..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-sand-bg border border-sand-border text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-ethio-600 placeholder:text-slate-400"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>

                    {/* Region Selector */}
                    <div className="relative">
                      <select
                        value={heroRegion}
                        onChange={(e) => setHeroRegion(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-sand-bg border border-sand-border text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-ethio-600 appearance-none"
                      >
                        <option value="all">All Ethiopian Regions</option>
                        <option value="Oromia">Oromia (Meki, Ada'a, Adama)</option>
                        <option value="Amhara">Amhara (Bahir Dar, Gondar)</option>
                        <option value="Sidama">Sidama (Hawassa, Yirgalem)</option>
                        <option value="SNNPR / Sidama">SNNPR & Guji</option>
                        <option value="Addis Ababa">Addis Ababa Hub</option>
                        <option value="Tigray">Tigray</option>
                        <option value="Dire Dawa">Dire Dawa & Harar</option>
                      </select>
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-2xl bg-sand-subtle hover:bg-emerald-50 border border-sand-border text-ethio-800 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Search Marketplace Products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Real Platform Capability Trust Indicators (No fake statistics) */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200/60 max-w-xl">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-ethio-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">Direct Farm Sourcing</div>
                    <div className="text-[11px] text-slate-500">Connecting farmers and buyers</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">Unified Marketplace</div>
                    <div className="text-[11px] text-slate-500">Grains, coffee, veg & oilseeds</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">Haulage Coordination</div>
                    <div className="text-[11px] text-slate-500">Regional logistics dispatch</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Imagery with Floating Platform Badges */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Hero Card with Transition */}
                <div className="rounded-3xl overflow-hidden shadow-float border-4 border-white aspect-[4/5] bg-ethio-950 relative group">
                  <img
                    src={heroSlide === 0
                      ? "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80"
                      : "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80"
                    }
                    alt="Ethiopian farmer harvesting fresh crops in green agricultural field"
                    className="w-full h-full object-cover transition-all duration-700 ease-out transform group-hover:scale-105"
                  />
                  
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ethio-950/90 via-ethio-950/20 to-transparent"></div>

                  {/* Slide Switcher Controls */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full z-20">
                    <button
                      onClick={() => setHeroSlide(0)}
                      className={`h-2 rounded-full transition-all ${heroSlide === 0 ? 'w-5 bg-emerald-400' : 'w-2 bg-white/60'}`}
                      title="Rift Valley Fresh Produce"
                    />
                    <button
                      onClick={() => setHeroSlide(1)}
                      className={`h-2 rounded-full transition-all ${heroSlide === 1 ? 'w-5 bg-emerald-400' : 'w-2 bg-white/60'}`}
                      title="Ada'a Magna Teff Grain"
                    />
                  </div>

                  {/* Caption on image */}
                  <div className="absolute bottom-6 left-6 right-6 text-white z-20">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                      {heroSlide === 0 ? "Direct From Source · Meki & Rift Valley" : "Highland Commodities · Ada'a & Bale"}
                    </span>
                    <h3 className="text-xl font-extrabold leading-tight">
                      {heroSlide === 0
                        ? "Rift Valley Vegetable Harvests"
                        : "Highland White Teff & Wheat Grains"}
                    </h3>
                    <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                      {heroSlide === 0
                        ? "Wholesale onions, tomatoes, and peppers connected directly from farms to commercial buyers."
                        : "Export-grade Magna white teff and durum wheat traded with standardized Ethiopian quintals."}
                    </p>

                    {/* Verified Chain Pill */}
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold text-emerald-200 border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Verified Farm Sourcing & Logistics</span>
                    </div>
                  </div>
                </div>

                {/* Floating Badge 1: Logistics Coordination */}
                <div className="absolute -top-4 -left-4 sm:-left-6 bg-white p-3.5 rounded-2xl shadow-float border border-sand-border flex items-center gap-3 backdrop-blur-md z-30 animate-float">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-ethio-700 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Transportation Fleet</span>
                    <span className="text-[11px] text-slate-500">Farm Gate to Market Center</span>
                  </div>
                </div>

                {/* Floating Badge 2: Payment Escrow */}
                <div className="absolute -bottom-4 -right-4 sm:-right-6 bg-white p-3.5 rounded-2xl shadow-float border border-sand-border flex items-center gap-3 z-30 animate-float-delayed">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">Protected Settlement</span>
                    <span className="text-[11px] text-slate-500">Telebirr & CBE Escrow</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE MARKETPLACE PREVIEW */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-extrabold text-ethio-700 uppercase tracking-wider block mb-1">
              Public Marketplace Preview
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ethio-950">
              Explore Agricultural Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              Preview major agricultural commodities traded across Ethiopian regions. Sign in to view full supplier directories, pricing, and place orders.
            </p>
          </div>
          
          <button
            onClick={() => triggerAuthPrompt(
              '/marketplace',
              'Sign In to Browse Full Marketplace',
              'Sign in or create an account to view all active produce listings, current wholesale prices, and seller information.'
            )}
            className="text-xs sm:text-sm font-bold text-ethio-700 hover:text-ethio-900 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>View Full Market Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PUBLIC_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon || Sprout
            return (
              <div
                key={cat.id}
                onClick={() => triggerAuthPrompt(
                  `/marketplace?category=${cat.slug}`,
                  `Sign In to Browse ${cat.name}`,
                  `Access available ${cat.cropExamples} listings, compare wholesale prices, and connect directly with verified regional producers.`
                )}
                className="bg-white rounded-3xl border border-sand-border p-5 card-hover cursor-pointer group shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-4 bg-sand-subtle relative">
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm text-ethio-800 flex items-center justify-center shadow-sm">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white drop-shadow">
                        {cat.nameAm}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-ethio-700 transition-colors flex items-center justify-between">
                    <span>{cat.name}</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-ethio-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {cat.cropExamples}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1 text-ethio-700 font-bold">
                    <Lock className="w-3 h-3" />
                    <span>Member Access Required</span>
                  </span>
                  <span className="group-hover:text-slate-700 transition-colors">
                    Preview Category →
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Real Public Product Previews (Sanitized, no private contact info) */}
        {previewProducts.length > 0 && (
          <div className="mt-14 pt-10 border-t border-sand-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-extrabold text-ethio-700 uppercase tracking-wider block">
                  Live Harvest Previews
                </span>
                <h3 className="text-xl font-extrabold text-ethio-950">
                  Sample Wholesale Produce in Stock
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                Sign in to view complete seller details & submit quotation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {previewProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => triggerAuthPrompt(
                    `/products/${prod.id}`,
                    `Sign In to View ${prod.title}`,
                    'Complete harvest specifications, seller verification status, and direct purchase / quotation options require sign-in.'
                  )}
                  className="bg-white rounded-3xl border border-sand-border p-4 card-hover cursor-pointer shadow-sm group flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-sand-subtle relative mb-3">
                      <img
                        src={prod.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80'}
                        alt={prod.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {prod.isOrganic && (
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow-sm">
                          Organic
                        </span>
                      )}
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
                        {prod.unit}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-ethio-600" />
                      <span>{prod.city}, {prod.region}</span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-ethio-700 transition-colors line-clamp-1">
                      {prod.title}
                    </h4>

                    {prod.variety && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        Variety: {prod.variety} · {prod.grade || 'Standard Grade'}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Indicative Price</span>
                      <span className="text-sm font-extrabold text-ethio-900">
                        {prod.pricePerUnit?.toLocaleString()} ETB <span className="text-[10px] font-normal text-slate-500">/ {prod.unit?.toLowerCase()}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-ethio-700 group-hover:text-ethio-900">
                      <Lock className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

      {/* 3. HOW ETHIOMARKET WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-sand-subtle rounded-3xl border border-sand-border p-8 lg:p-12">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold text-ethio-700 uppercase tracking-wider block mb-2">
              Four-Step Agricultural Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ethio-950">
              How EthioMarket Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              A transparent, connected process designed for Ethiopian smallholders, commercial agro-enterprises, wholesale buyers, and regional haulage fleets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-6 border border-sand-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-ethio-800 flex items-center justify-center font-extrabold text-lg mb-4">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Create an Account</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Register for free and select your primary role as a Farmer, Commercial Buyer, or Transporter to unlock specialized workspaces and tools.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-ethio-700">
                Tailored Workspaces
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-6 border border-sand-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-lg mb-4">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Discover Opportunities</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Find agricultural commodities by region, connect with bulk purchasing requests, or browse available cargo loads needing regional transport.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-amber-700">
                Transparent Matching
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-6 border border-sand-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-lg mb-4">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Connect & Negotiate</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Submit quotation requests, agree on grade specifications and quantities, counter-offer on volume pricing, and finalize binding terms.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-blue-700">
                Audited Negotiations
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-3xl p-6 border border-sand-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-extrabold text-lg mb-4">
                  4
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Coordinate Fulfillment</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Assign verified regional transporters, monitor live haulage progression, and settle payments safely through escrow on delivery confirmation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-purple-700">
                Secure Delivery & Payout
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. SEPARATE VALUE PROPOSITIONS FOR EACH ROLE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-extrabold text-ethio-700 uppercase tracking-wider block mb-1">
            Built for Every Agricultural Participant
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ethio-950">
            Tailored Experiences for Every Role
          </h2>