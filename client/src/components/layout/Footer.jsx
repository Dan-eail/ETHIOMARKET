import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Sprout, ShieldCheck, Truck, Scale, Award, Mail, FileText, CheckCircle2, X } from 'lucide-react'

export const Footer = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [legalModal, setLegalModal] = useState(null) // 'terms' | 'privacy' | null

  const scrollToSection = (sectionId) => {
    if (location.pathname === '/') {
      const el = document.getElementById(sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    navigate(`/#${sectionId}`)
  }

  return (
    <footer className="bg-ethio-950 text-slate-300 pt-16 pb-12 border-t border-ethio-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value proposition badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-ethio-900 text-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-ethio-900 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Direct & Verified Sourcing</h4>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Connect directly with Ethiopian agricultural producers and verified cooperatives with regional credentials.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-ethio-900 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Connected Transport Fleet</h4>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Regional cargo dispatch linking farm gates in Meki, Ada'a, and Hawassa to Addis Ababa and central markets.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-ethio-900 text-emerald-400 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Fair Pricing & Protected Escrow</h4>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Transparent price discovery in ETB per quintal, kg, and crate. Integrated Telebirr, CBE Birr & Cash-on-Delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12">
          
          {/* Brand Info */}
          <div className="col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ethio-700 text-white flex items-center justify-center">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight">
                Ethio<span className="text-emerald-400">Market</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-4 max-w-sm leading-relaxed">
              Empowering Ethiopian agricultural producers, commercial buyers, and logistics providers through price transparency, direct negotiation, and coordinated fulfillment.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-emerald-400 font-semibold">
              <Award className="w-4 h-4" />
              <span>Certified Agri-Tech Platform · Addis Ababa, Ethiopia</span>
            </div>
          </div>

          {/* Quick Platform Exploration */}
          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Explore Platform</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => scrollToSection('categories')} className="hover:text-white transition-colors text-left">
                  Produce Categories
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors text-left">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('platform-features')} className="hover:text-white transition-colors text-left">
                  Marketplace Capabilities
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors text-left">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors text-left">
                  About EthioMarket
                </button>
              </li>
            </ul>
          </div>

          {/* Role-Specific Workspaces & Registration */}
          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Join by Role</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/register?role=FARMER" className="hover:text-white transition-colors">Join as a Farmer</Link></li>
              <li><Link to="/register?role=BUYER" className="hover:text-white transition-colors">Join as a Buyer</Link></li>
              <li><Link to="/register?role=TRANSPORTER" className="hover:text-white transition-colors">Join as a Transporter</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In to Account</Link></li>
            </ul>
          </div>

          {/* Regional Hubs & Contact */}
          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Regional Hubs</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><span>Oromia (Adama, Meki, Ziway)</span></li>
              <li><span>Amhara (Bahir Dar, Gondar)</span></li>
              <li><span>Sidama (Hawassa, Yirgalem)</span></li>
              <li><span>Addis Ababa (Bole, Merkato)</span></li>
              <li className="pt-2 text-emerald-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>support@ethiomarket.et</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright, legal & dynamic year */}
        <div className="pt-8 border-t border-ethio-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} EthioMarket Technologies PLC. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setLegalModal('privacy')}
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setLegalModal('terms')}
              className="hover:text-slate-300 transition-colors"
            >
              Terms of Service
            </button>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline">Currency: ETB (Ethiopian Birr)</span>
          </div>
        </div>

      </div>

      {/* Legal Information Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 text-slate-800 shadow-float border border-sand-border">
            <button
              onClick={() => setLegalModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-ethio-800 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-extrabold text-ethio-950">
                {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-80 overflow-y-auto pr-2">
              {legalModal === 'privacy' ? (
                <>
                  <p>
                    EthioMarket is committed to protecting your privacy. We collect only necessary account registration details (name, email, phone number, and cooperative/farm information) to facilitate agricultural trade matching and logistics coordination.
                  </p>
                  <p>
                    Seller phone numbers and contact details are shielded from unauthenticated visitors and displayed only to authenticated members during quotation negotiation and order fulfillment.
                  </p>
                  <p>
                    We do not sell user data to third parties. All transaction records and delivery logs are securely handled in accordance with Ethiopian data protection regulations.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    By using EthioMarket, buyers, farmers, and transporters agree to transact in good faith using Ethiopian Birr (ETB) and standard measurement units (Quintal, Kilogram, Crate, Sack).
                  </p>
                  <p>
                    Quotation requests and accepted counter-offers form binding purchase agreements once confirmed. Transporters are responsible for maintaining safe haulage standards from farm pickup to destination delivery.
                  </p>
                  <p>
                    Account verification requires submission of valid cooperative, farm, or commercial business documentation upon platform request.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setLegalModal(null)}
                className="px-5 py-2 rounded-2xl bg-ethio-700 hover:bg-ethio-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </footer>
  )
}

export default Footer
