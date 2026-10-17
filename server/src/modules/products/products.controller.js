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

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            isVerified: true,
            avatarUrl: true,
            farmerProfile: true,
          }
        }
      }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product listing not found' })
    }

    // Increment views count non-blockingly
    prisma.product.update({
      where: { id },
      data: { viewsCount: { increment: 1 } }
    }).catch(err => console.error('Failed to increment views', err))

    // Fetch related products in same category
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: id },
        status: 'PUBLISHED'
      },
      include: {
        images: true,
        category: true,
        seller: { select: { id: true, name: true, isVerified: true } }
      },
      take: 4
    })

    res.json({ product, related })
  } catch (err) {
    next(err)
  }
}

export const createProduct = async (req, res, next) => {
  try {
    const validated = productCreateSchema.parse(req.body)

    const product = await prisma.product.create({
      data: {
        sellerId: req.user.id,
        categoryId: validated.categoryId,
        title: validated.title,
        slug: validated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4),
        description: validated.description,
        variety: validated.variety,
        grade: validated.grade,
        harvestDate: validated.harvestDate ? new Date(validated.harvestDate) : new Date(),
        unit: validated.unit,
        pricePerUnit: validated.pricePerUnit,
        minOrderQty: validated.minOrderQty,
        availableQty: validated.availableQty,
        region: validated.region,
        city: validated.city,
        specificLocation: validated.specificLocation,
        isOrganic: validated.isOrganic,
        status: 'PUBLISHED',
        images: {
          create: (validated.imageUrls && validated.imageUrls.length > 0
            ? validated.imageUrls
            : ['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80']
          ).map((url, idx) => ({
            url,
            isPrimary: idx === 0,
            sortOrder: idx
          }))
        }
      },
      include: {
        images: true,
        category: true,
      }
    })

    res.status(201).json({
      message: 'Produce listing created successfully',
      product
    })
  } catch (err) {
    next(err)
  }
}

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await prisma.product.findUnique({ where: { id } })

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Verify ownership or ADMIN
    if (existing.sellerId !== req.user.id && !req.userRoles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Forbidden: You cannot modify listings belonging to another producer' })
    }

    const {
      title,
      description,
      pricePerUnit,
      availableQty,
      status,
      variety,
      grade,
      unit,
      minOrderQty,
      isOrganic,
      region,
      city
    } = req.body

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(pricePerUnit !== undefined && { pricePerUnit: parseFloat(pricePerUnit) }),
        ...(availableQty !== undefined && { availableQty: parseFloat(availableQty) }),
        ...(status && { status }),
        ...(variety && { variety }),
        ...(grade && { grade }),
        ...(unit && { unit }),
        ...(minOrderQty !== undefined && { minOrderQty: parseFloat(minOrderQty) }),
        ...(isOrganic !== undefined && { isOrganic: Boolean(isOrganic) }),
        ...(region && { region }),
        ...(city && { city }),
      },
      include: {
        images: true,
        category: true,
      }
    })

    res.json({ message: 'Product updated successfully', product: updated })
  } catch (err) {
    next(err)
  }
}

export const getFarmerListings = async (req, res, next) => {
  try {
    const listings = await prisma.product.findMany({
      where: { sellerId: req.user.id },
      include: {
        category: true,
        images: true,
        _count: {
          select: { quotes: true, orderItems: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ listings })
  } catch (err) {
    next(err)
  }
}

export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params
    const { availableQty, lowStockThreshold } = req.body

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Product not found' })
    if (existing.sellerId !== req.user.id && !req.userRoles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Forbidden: You do not own this product' })
    }

    const qty = parseFloat(availableQty)
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ error: 'Invalid quantity. Must be a non-negative number.' })
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        availableQty: qty,
        status: qty === 0 ? 'SOLD_OUT' : (existing.status === 'SOLD_OUT' ? 'PUBLISHED' : existing.status),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: parseFloat(lowStockThreshold) })
      }
    })

    res.json({ message: 'Stock updated successfully', product: updated })
  } catch (err) {
    next(err)
  }
}

export const matchSuppliers = async (req, res, next) => {
  try {
    const { cropQuery, requestedQty, region, isOrganic } = req.body

    if (!cropQuery || !cropQuery.trim()) {
      return res.status(400).json({ error: 'Crop query is required for supplier matching' })
    }

    const targetQty = parseFloat(requestedQty) || 1

    const products = await prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: cropQuery.trim() } },
          { description: { contains: cropQuery.trim() } },
          { variety: { contains: cropQuery.trim() } }
        ]
      },
      include: {
        category: true,
        images: true,
        seller: {
          select: {
            id: true,
            name: true,
            isVerified: true,
            farmerProfile: true,
          }
        }
      }
    })

    const ranked = products.map((prod) => {
      let score = 50
      const reasons = []

      if (prod.availableQty >= targetQty) {
        score += 25
        reasons.push(`In stock: ${prod.availableQty} ${prod.unit} available (meets your target of ${targetQty} ${prod.unit})`)
      } else {
        reasons.push(`Partial stock: ${prod.availableQty} ${prod.unit} available`)
      }

      if (region && prod.region.toLowerCase().includes(region.toLowerCase())) {
        score += 15
        reasons.push(`Direct regional proximity in ${prod.city}, ${prod.region}`)
      }

      if (prod.seller?.isVerified || prod.seller?.farmerProfile?.verifiedBadge) {
        score += 10
        reasons.push('Verified agricultural cooperative license')
      }

      if (isOrganic && prod.isOrganic) {
        score += 10
        reasons.push('Certified 100% Organic harvest')
      }

      return {
        product: prod,
        matchScore: Math.min(score, 100),
        matchReasons: reasons
      }
    }).sort((a, b) => b.matchScore - a.matchScore)

    res.json({ matches: ranked, totalFound: ranked.length })
  } catch (err) {
    next(err)
  }
}

