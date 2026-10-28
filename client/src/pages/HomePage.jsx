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