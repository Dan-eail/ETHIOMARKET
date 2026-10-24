import prisma from '../../config/database.js'

export const getFavorites = async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            images: true,
            category: true,
            seller: {
              select: {
                id: true,
                name: true,
                isVerified: true,
                farmerProfile: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ favorites })
  } catch (err) {
    next(err)
  }
}

export const toggleFavorite = async (req, res, next) => {
  try {
    const { productId } = req.params

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        }
      }
    })

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      })
      return res.json({ favorited: false, message: 'Removed from favorites' })
    }

    const created = await prisma.favorite.create({
      data: {
        userId: req.user.id,
        productId,
      }
    })

    res.status(201).json({ favorited: true, message: 'Saved to favorites', favorite: created })
  } catch (err) {
    next(err)
  }
}
