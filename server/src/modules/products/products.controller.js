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
      category,
      region,
      unit,
      minPrice,
      maxPrice,
      isOrganic,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query

    // Check if protected marketplace search/filtering is being performed
    const hasSearchOrFilter = Boolean(
      (search && search.trim()) ||
      (category && category.trim()) ||
      (region && region !== 'all') ||
      (unit && unit !== 'all') ||
      minPrice ||
      maxPrice ||
      isOrganic === 'true'
    )

    // Unauthenticated visitors are restricted from protected product search & filters
    if (hasSearchOrFilter && !req.user) {
      return res.status(401).json({
        error: 'Authentication required to search or filter marketplace products',
        code: 'AUTH_REQUIRED'
      })
    }

    const where = {
      status: 'PUBLISHED',
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { variety: { contains: search } },
        { city: { contains: search } },
      ]
    }

    if (category) {
      where.category = {
        slug: category
      }
    }

    if (region && region !== 'all') {
      where.region = region
    }

    if (unit && unit !== 'all') {
      where.unit = unit
    }

    if (isOrganic === 'true') {
      where.isOrganic = true
    }

    if (minPrice || maxPrice) {
      where.pricePerUnit = {}
      if (minPrice) where.pricePerUnit.gte = parseFloat(minPrice)
      if (maxPrice) where.pricePerUnit.lte = parseFloat(maxPrice)
    }

    // Sorting
    let orderBy = { createdAt: 'desc' }
    if (sort === 'price_asc') orderBy = { pricePerUnit: 'asc' }
    if (sort === 'price_desc') orderBy = { pricePerUnit: 'desc' }
    if (sort === 'popular') orderBy = { viewsCount: 'desc' }

    const requestedLimit = parseInt(limit) || 12
    const take = !req.user ? Math.min(requestedLimit, 6) : requestedLimit
    const skip = (parseInt(page) - 1) * take

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: true,
          seller: {
            select: {
              id: true,
              name: true,
              isVerified: true,
              farmerProfile: {
                select: {
                  farmName: true,
                  region: true,
                  organicCertified: true,
                  verifiedBadge: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take
      }),
      prisma.product.count({ where })
    ])

    res.json({
      products,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    })
  } catch (err) {
    next(err)
  }
}
