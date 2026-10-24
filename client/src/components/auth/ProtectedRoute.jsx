import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDefaultDashboardForRole } from '../../utils/redirect'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading, activeRole } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-ethio-700 flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 border-3 border-ethio-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-xs font-semibold text-slate-500">Checking authorization...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleNames = user?.roles?.map(r => r.role) || [activeRole]
    const hasRole = userRoleNames.some(role => allowedRoles.includes(role))

    if (!hasRole) {
      // User is authenticated but does not possess the specific role required.
      // Redirect safely to their own default dashboard.
      const primaryRole = user?.roles?.find(r => r.isPrimary)?.role || user?.roles?.[0]?.role || activeRole || 'BUYER'
      const fallbackDashboard = getDefaultDashboardForRole(primaryRole)
      return <Navigate to={fallbackDashboard} replace />
    }
  }

  return children
}

