/**
 * Safely validates and sanitizes a post-login or post-registration destination.
 * Prevents open redirect attacks by ensuring the target is a relative path starting
 * with a single '/' and matching approved application routes.
 */
export const getSafeRedirectUrl = (url, fallback = null) => {
  if (!url || typeof url !== 'string') return fallback

  const trimmed = url.trim()

  // Must start with single / and not protocol-relative // or backslash /\
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback
  }

  try {
    const parsed = new URL(trimmed, 'http://localhost')
    const pathname = parsed.pathname

    // List of approved internal route prefixes
    const allowedPrefixes = [
      '/',
      '/marketplace',
      '/products',
      '/dashboard/farmer',
      '/dashboard/buyer',
      '/dashboard/transporter',
      '/dashboard/admin',
      '/checkout/verify'
    ]

    const isAllowed = allowedPrefixes.some(prefix => 
      pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?')
    )

    if (!isAllowed) return fallback

    return pathname + parsed.search + parsed.hash
  } catch {
    return fallback
  }
}

/**
 * Returns the default dashboard URL for a given role.
 */
export const getDefaultDashboardForRole = (role) => {
  switch (role) {
    case 'FARMER':
      return '/dashboard/farmer'
    case 'BUYER':
      return '/dashboard/buyer'
    case 'TRANSPORTER':
      return '/dashboard/transporter'
    case 'ADMIN':
      return '/dashboard/admin'
    default:
      return '/marketplace'
  }
}

