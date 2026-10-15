import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../../config/database.js'
import { config } from '../../config/env.js'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(9, 'Phone number required (e.g. +2519...)'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['FARMER', 'BUYER', 'TRANSPORTER']),
  // Role specific optional fields
  businessName: z.string().optional(),
  farmName: z.string().optional(),
  companyName: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
})

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

export const register = async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body)

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validated.email }, { phone: validated.phone }]
      }
    })

    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email or phone already exists' })
    }

    const passwordHash = await bcrypt.hash(validated.password, 10)

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        passwordHash,
        status: 'ACTIVE',
        roles: {
          create: [{ role: validated.role, isPrimary: true }]
        },
        ...(validated.role === 'FARMER' && {
          farmerProfile: {
            create: {
              farmName: validated.farmName || `${validated.name}'s Farm`,
              region: validated.region || 'Oromia',
              city: validated.city || 'Meki',
            }
          }
        }),
        ...(validated.role === 'BUYER' && {
          buyerProfile: {
            create: {
              businessName: validated.businessName || `${validated.name} Enterprises`,
              businessType: 'RETAILER',
              region: validated.region || 'Addis Ababa',
              city: validated.city || 'Bole',
            }
          }
        }),
        ...(validated.role === 'TRANSPORTER' && {
          transporterProfile: {
            create: {
              companyName: validated.companyName || `${validated.name} Logistics`,
              regionsCovered: validated.region || 'Addis Ababa, Oromia',
            }
          }
        }),
      },
      include: {
        roles: true,
        farmerProfile: true,
        buyerProfile: true,
        transporterProfile: true,
      }
    })

    const token = generateToken(user.id)
    const { passwordHash: _, ...safeUser } = user

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: safeUser,
    })
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const { emailOrPhone, password } = req.body
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Email/phone and password are required' })
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phone: emailOrPhone }]
      },
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
      return res.status(401).json({ error: 'Invalid credentials. User not found.' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' })
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Account suspended. Contact support.' })
    }

    const token = generateToken(user.id)
    const { passwordHash: _, ...safeUser } = user

    res.json({
      message: 'Login successful',
      token,
      user: safeUser,
    })
  } catch (err) {
    next(err)
  }
}

export const getMe = async (req, res) => {
  const { passwordHash: _, ...safeUser } = req.user
  res.json({ user: safeUser })
}

// Demo 1-click switcher for instant testing of all roles
export const demoLogin = async (req, res, next) => {
  try {
    const { role } = req.body // 'FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN'
    const targetEmail =
      role === 'ADMIN' ? 'admin@ethiomarket.et' :
      role === 'BUYER' ? 'buyer@ethiomarket.et' :
      role === 'TRANSPORTER' ? 'transporter@ethiomarket.et' :
      'farmer@ethiomarket.et'

    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
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
      return res.status(404).json({ error: `Demo account for role ${role} not found. Run database seed.` })
    }

    const token = generateToken(user.id)
    const { passwordHash: _, ...safeUser } = user

    res.json({
      message: `Switched to demo ${role} account (${safeUser.name})`,
      token,
      user: safeUser,
    })
  } catch (err) {
    next(err)
  }
}
