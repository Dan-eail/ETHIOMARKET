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