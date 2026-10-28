import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

// Pages
import { HomePage } from './pages/HomePage'
import { MarketplacePage } from './pages/MarketplacePage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { FarmerDashboard } from './pages/farmer/FarmerDashboard'
import { BuyerDashboard } from './pages/buyer/BuyerDashboard'
import { TransporterDashboard } from './pages/transporter/TransporterDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { PaymentVerifyPage } from './pages/checkout/PaymentVerifyPage'
import { FaydaCallbackPage } from './pages/kyc/FaydaCallbackPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-sand-bg text-slate-900 font-sans selection:bg-ethio-200">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Public Landing Page for EVERY visitor (guests, farmers, buyers, transporters) */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Protected Marketplace Routes (Require Authentication) */}
                  <Route
                    path="/marketplace"
                    element={
                      <ProtectedRoute>
                        <MarketplacePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/:id"
                    element={
                      <ProtectedRoute>
                        <ProductDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout/verify"
                    element={
                      <ProtectedRoute>
                        <PaymentVerifyPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/kyc/fayda/callback"
                    element={
                      <ProtectedRoute>
                        <FaydaCallbackPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Role-Specific Workspaces & Dashboards */}
                  <Route
                    path="/dashboard/farmer"
                    element={
                      <ProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
                        <FarmerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/buyer"
                    element={
                      <ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}>
                        <BuyerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/transporter"
                    element={
                      <ProtectedRoute allowedRoles={['TRANSPORTER', 'ADMIN']}>
                        <TransporterDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/admin"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback to Shared Landing Page */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
