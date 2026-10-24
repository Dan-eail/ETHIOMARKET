import prisma from '../../config/database.js'

export const getMarketPrices = async (req, res, next) => {
  try {
    const { category, region } = req.query
    const where = {}
    if (category) where.categorySlug = category
    if (region && region !== 'all') where.region = { contains: region }

    const prices = await prisma.marketPriceObservation.findMany({
      where,
      orderBy: { observationDate: 'desc' },
      take: 20
    })

    res.json({ prices })
  } catch (err) {
    next(err)
  }
}
