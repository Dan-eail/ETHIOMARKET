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