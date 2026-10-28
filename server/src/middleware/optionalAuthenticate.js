import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import prisma from '../config/database.js'

export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.split(' ')[1]
    let decoded
    try {
      decoded = jwt.verify(token, config.jwtSecret)
    } catch {
      return next()
    }

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

    if (user && user.status !== 'SUSPENDED') {
      req.user = user
      req.userRoles = user.roles.map(r => r.role)
    }

    next()
  } catch (err) {
    next(err)
  }
}

