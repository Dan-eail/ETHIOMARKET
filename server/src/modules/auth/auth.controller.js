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