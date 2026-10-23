import prisma from '../../config/database.js'
import { ChapaService } from './chapa.service.js'

export const initializePayment = async (req, res, next) => {
  try {
    const { orderId, returnUrl, idempotencyKey } = req.body

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required to initialize payment.' })
    }

    const result = await ChapaService.initializePayment({
      orderId,
      buyerId: req.user.id,
      user: req.user,
      returnUrl,
      idempotencyKey
    })

    res.status(201).json({
      message: 'Payment checkout initialized successfully.',
      ...result
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const verifyPayment = async (req, res, next) => {
  try {
    const { tx_ref } = req.params
    const { mockProviderData } = req.body || {}

    const result = await ChapaService.verifyPayment({
      tx_ref,
      requestingUserId: req.user.id,
      requestingUserRoles: req.userRoles,
      mockProviderData
    })

    res.json({
      message: result.alreadyProcessed
        ? 'Payment has already been verified and processed.'
        : 'Payment successfully verified and order confirmed.',
      ...result
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-chapa-signature']
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body)

    const result = await ChapaService.handleWebhook({
      rawBody,
      signature,
      payload: req.body
    })

    res.status(200).json({ success: true, ...result })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const getPayments = async (req, res, next) => {
  try {
    const { status, orderId, page = 1, limit = 20 } = req.query
    const isAdmin = req.userRoles && req.userRoles.includes('ADMIN')

    const where = {}
    if (!isAdmin) {
      where.buyerId = req.user.id
    }
    if (status && status !== 'ALL') {
      where.status = status
    }
    if (orderId) {
      where.orderId = orderId
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit, 10),
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
              totalAmount: true
            }
          },
          buyer: {
            select: { id: true, name: true, email: true, phone: true }
          },
          refunds: true
        }
      }),
      prisma.payment.count({ where })
    ])

    res.json({
      payments,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    })
  } catch (err) {
    next(err)
  }
}

export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params
    const isAdmin = req.userRoles && req.userRoles.includes('ADMIN')

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: true,
            seller: { select: { id: true, name: true } },
            buyer: { select: { id: true, name: true } }
          }
        },
        refunds: true
      }
    })

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found.' })
    }

    if (!isAdmin && payment.buyerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view this payment.' })
    }

    res.json({ payment })
  } catch (err) {
    next(err)
  }
}

export const reconcilePayment = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await ChapaService.reconcilePayment({
      paymentId: id,
      adminUserId: req.user.id
    })

    res.json({
      message: 'Payment successfully reconciled with Chapa provider.',
      result
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const requestRefund = async (req, res, next) => {
  try {
    const { id } = req.params
    const { amount, reason } = req.body

    const refund = await ChapaService.requestRefund({
      paymentId: id,
      amount,
      reason,
      requestedById: req.user.id,
      userRoles: req.userRoles
    })

    res.status(201).json({
      message: 'Refund request processed.',
      refund
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const getReconciliationOverview = async (req, res, next) => {
  try {
    const [
      totalCount,
      successCount,
      pendingCount,
      failedCount,
      refundedCount,
      totalVolume,
      recentPending
    ] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'SUCCESS' } }),
      prisma.payment.count({ where: { status: { in: ['INITIATED', 'PENDING'] } } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.payment.count({ where: { status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      prisma.payment.findMany({
        where: { status: { in: ['INITIATED', 'PENDING'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          order: { select: { id: true, orderNumber: true, totalAmount: true } },
          buyer: { select: { id: true, name: true } }
        }
      })
    ])

    res.json({
      metrics: {
        totalCount,
        successCount,
        pendingCount,
        failedCount,
        refundedCount,
        totalVerifiedVolumeETB: totalVolume._sum.amount || 0
      },
      recentPending
    })
  } catch (err) {
    next(err)
  }
}
