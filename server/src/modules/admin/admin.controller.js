import prisma from '../../config/database.js'

export const getPlatformStats = async (req, res, next) => {
  try {
    const [
      usersCount,
      farmersCount,
      buyersCount,
      transportersCount,
      productsCount,
      ordersCount,
      ordersSum,
      pendingKycReviewsCount,
      paymentsCount,
      paymentsSuccessSum
    ] = await Promise.all([
      prisma.user.count(),
      prisma.userRole.count({ where: { role: 'FARMER' } }),
      prisma.userRole.count({ where: { role: 'BUYER' } }),
      prisma.userRole.count({ where: { role: 'TRANSPORTER' } }),
      prisma.product.count({ where: { status: 'PUBLISHED' } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.verificationRecord.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.payment.count(),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true }
      })
    ])

    const totalGMV = ordersSum._sum.totalAmount || 0
    const totalVerifiedPayments = paymentsSuccessSum._sum.amount || 0

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
        items: true
      }
    })

    // Volume by category
    const categoryVolume = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } }
      }
    })

    res.json({
      stats: {
        usersCount,
        farmersCount,
        buyersCount,
        transportersCount,
        productsCount,
        ordersCount,
        totalGMV,
        pendingReviewsCount: pendingKycReviewsCount,
        paymentsCount,
        totalVerifiedPayments
      },
      recentOrders,
      categoryVolume
    })
  } catch (err) {
    next(err)
  }
}

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: true,
        farmerProfile: true,
        buyerProfile: true,
        transporterProfile: true,
        verificationRecords: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { productsSelling: true, ordersBought: true, ordersSold: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const safeUsers = users.map(({ passwordHash, ...u }) => u)
    res.json({ users: safeUsers })
  } catch (err) {
    next(err)
  }
}

export const verifyUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { isVerified } = req.body

    const user = await prisma.user.update({
      where: { id },
      data: { isVerified: Boolean(isVerified) }
    })

    // Also update farmer/transporter badge if applicable