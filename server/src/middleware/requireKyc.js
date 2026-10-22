export const requireKyc = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  // Admins are exempt from seller/buyer KYC requirements
  if (req.userRoles && req.userRoles.includes('ADMIN')) {
    return next()
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      error: 'Identity verification required. Please complete Fayda KYC or submit for manual review to perform this action.',
      code: 'KYC_REQUIRED',
      userStatus: req.user.status,
      isVerified: false
    })
  }

  next()
}
