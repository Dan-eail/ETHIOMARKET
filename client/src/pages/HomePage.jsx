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