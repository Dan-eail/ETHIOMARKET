import prisma from '../../config/database.js'
import { z } from 'zod'

const productCreateSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  categoryId: z.string(),
  description: z.string().min(10, 'Description should be detailed'),
  variety: z.string().optional(),
  grade: z.string().optional(),
  harvestDate: z.string().optional(),
  unit: z.enum(['KG', 'QUINTAL', 'TON', 'CRATE', 'SACK']),
  pricePerUnit: z.number().positive('Price must be greater than 0'),
  minOrderQty: z.number().positive().default(1),
  availableQty: z.number().nonnegative('Quantity cannot be negative'),
  region: z.string(),
  city: z.string(),
  specificLocation: z.string().optional(),
  isOrganic: z.boolean().default(false),
  imageUrls: z.array(z.string()).optional(),
})

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,