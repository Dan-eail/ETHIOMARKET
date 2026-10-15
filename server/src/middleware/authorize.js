export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.userRoles) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' })
    }

    // ADMIN has super-user override permissions
    if (req.userRoles.includes('ADMIN')) {
      return next()
    }

    const hasPermission = allowedRoles.some(role => req.userRoles.includes(role))
    if (!hasPermission) {
      return res.status(403).json({
        error: `Forbidden: This resource requires one of the following roles: [${allowedRoles.join(', ')}]`,
        userRoles: req.userRoles
      })
    }

    next()
  }
}
