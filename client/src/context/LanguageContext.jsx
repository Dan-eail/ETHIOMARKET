import React, { createContext, useContext, useState } from 'react'

const translations = {
  en: {
    heroTitle: 'Fresh Produce. Fairer Markets.',
    heroSubtitle: 'Connect directly with Ethiopian farmers, compare bulk wholesale prices, and source agricultural produce with confidence.',
    searchPlaceholder: 'Search onions, teff, coffee, tomatoes...',
    allCategories: 'All Categories',
    exploreProducts: 'Explore Products',
    farmers: 'Farmers',
    buyers: 'Buyers',
    transporters: 'Transporters',
    verifiedSeller: 'Verified Seller',
    minOrder: 'Min. Order',
    available: 'In Stock',
    requestQuote: 'Request Quote',
    buyNow: 'Direct Purchase',
    dashboard: 'Workspace',
    login: 'Log In',
    register: 'Join Platform',
    demoRole: 'Demo Mode Role',
    howItWorks: 'How EthioMarket Works',
  },
  am: {
    heroTitle: 'ትኩስ የግብርና ምርቶች። ፍትሃዊ ገበያ።',
    heroSubtitle: 'ከኢትዮጵያ ገበሬዎች በቀጥታ ይገናኙ፣ የጅምላ ዋጋዎችን ያወዳድሩ፣ እና አስተማማኝ ምርቶችን በሙሉ እምነት ይግዙ።',
    searchPlaceholder: 'ቀይ ሽንኩርት፣ ጤፍ፣ ቡና፣ ቲማቲም ፈልግ...',
    allCategories: 'ሁሉም ምድቦች',
    exploreProducts: 'ምርቶችን ያስሱ',
    farmers: 'አምራች ገበሬዎች',
    buyers: 'ነጋዴዎችና ገዢዎች',
    transporters: 'አጓጓዦች',
    verifiedSeller: 'የተረጋገጠ አምራች',
    minOrder: 'ዝቅተኛ ትዕዛዝ',
    available: 'በክምችት ላይ ያለ',
    requestQuote: 'ዋጋ ተደራደር',
    buyNow: 'ቀጥታ ይግዙ',
    dashboard: 'የስራ ገጽ',
    login: 'ግባ',
    register: 'ይመዝገቡ',
    demoRole: 'የሙከራ ሚና ቀይር',
    howItWorks: 'ኢትዮማርኬት እንዴት ይሰራል?',
  }
}

const LanguageContext = createContext(null)

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en')

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'am' : 'en'))
  }

  const t = (key) => translations[lang][key] || translations['en'][key] || key

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}
