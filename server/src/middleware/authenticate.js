import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import prisma from '../config/database.js'

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication token missing or invalid format' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, config.jwtSecret)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: true,
        farmerProfile: true,
        buyerProfile: true,
        transporterProfile: {
          include: { vehicles: true }
        }
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'User associated with token no longer exists' })
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Account has been suspended. Please contact platform support.' })
    }

    req.user = user
    req.userRoles = user.roles.map(r => r.role)
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please log in again' })
    }
    return res.status(401).json({ error: 'Invalid authentication token' })
  }
}
