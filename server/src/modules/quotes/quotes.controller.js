import prisma from '../../config/database.js'
import { z } from 'zod'

const quoteCreateSchema = z.object({
  productId: z.string(),
  requestedQty: z.number().positive(),
  requestedPrice: z.number().positive(),
  note: z.string().optional(),
})

export const createQuote = async (req, res, next) => {
  try {
    const validated = quoteCreateSchema.parse(req.body)

    const product = await prisma.product.findUnique({
      where: { id: validated.productId }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    if (product.sellerId === req.user.id) {
      return res.status(400).json({ error: 'You cannot request a quote on your own product' })
    }

    if (validated.requestedQty > product.availableQty) {
      return res.status(400).json({
        error: `Requested quantity (${validated.requestedQty}) exceeds available stock (${product.availableQty})`
      })
    }

    const quoteNumber = 'Q-' + Date.now().toString().slice(-6)

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        buyerId: req.user.id,
        sellerId: product.sellerId,
        productId: product.id,
        requestedQty: validated.requestedQty,
        requestedPrice: validated.requestedPrice,
        unit: product.unit,
        currency: product.currency,
        note: validated.note,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 72 * 3600 * 1000), // 3 days expiry
        history: {
          create: [
            {
              senderId: req.user.id,
              senderRole: 'BUYER',
              proposedPrice: validated.requestedPrice,
              proposedQty: validated.requestedQty,
              note: validated.note || 'Initial quote request'
            }
          ]
        }
      },
      include: {
        product: { include: { images: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } }
      }
    })

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: product.sellerId,
        title: 'New Quote Request',
        message: `${req.user.name} offered ${validated.requestedPrice} ETB/${product.unit} for ${validated.requestedQty} ${product.unit} of ${product.title}`,
        type: 'QUOTE',
        linkUrl: `/dashboard/farmer/quotes`
      }
    })

    res.status(201).json({ message: 'Quotation request submitted', quote })
  } catch (err) {
    next(err)
  }
}

export const getQuotes = async (req, res, next) => {
  try {
    const isFarmer = req.userRoles.includes('FARMER')
    const roleFilter = req.query.as === 'seller' ? { sellerId: req.user.id } :
                       req.query.as === 'buyer' ? { buyerId: req.user.id } :
                       { OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }] }

    const quotes = await prisma.quote.findMany({
      where: roleFilter,
      include: {
        product: {
          include: { images: true }
        },
        buyer: {
          select: { id: true, name: true, phone: true, buyerProfile: true }
        },
        seller: {
          select: { id: true, name: true, phone: true, farmerProfile: true }
        },
        history: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    res.json({ quotes })
  } catch (err) {
    next(err)
  }
}

export const getQuoteById = async (req, res, next) => {
  try {
    const { id } = req.params

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        product: { include: { images: true, category: true } },
        buyer: { select: { id: true, name: true, phone: true, buyerProfile: true } },
        seller: { select: { id: true, name: true, phone: true, farmerProfile: true } },
        history: { orderBy: { createdAt: 'asc' } }
      }
    })

    if (!quote) return res.status(404).json({ error: 'Quote not found' })

    // Verify participant
    if (quote.buyerId !== req.user.id && quote.sellerId !== req.user.id && !req.userRoles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Access denied: You are not a party to this negotiation' })
    }

    res.json({ quote })
  } catch (err) {
    next(err)
  }
}

export const counterQuote = async (req, res, next) => {
  try {
    const { id } = req.params
    const { proposedPrice, proposedQty, note } = req.body

    const quote = await prisma.quote.findUnique({ where: { id } })
    if (!quote) return res.status(404).json({ error: 'Quote not found' })

    const isBuyer = quote.buyerId === req.user.id
    const isSeller = quote.sellerId === req.user.id

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Not authorized to negotiate this quote' })
    }

    if (quote.status === 'ACCEPTED' || quote.status === 'REJECTED') {
      return res.status(400).json({ error: `Cannot counter a quote that is already ${quote.status}` })
    }

    const price = parseFloat(proposedPrice) || quote.requestedPrice
    const qty = parseFloat(proposedQty) || quote.requestedQty

    // Create history item and update quote
    const [updatedQuote] = await prisma.$transaction([
      prisma.quote.update({
        where: { id },
        data: {
          status: 'COUNTERED',
          offeredPrice: price,
          requestedQty: qty,
          counterpartyNote: note,
          updatedAt: new Date(),
        },
        include: {
          product: true,
          buyer: true,
          seller: true,
          history: { orderBy: { createdAt: 'asc' } }
        }
      }),
      prisma.quoteHistory.create({
        data: {
          quoteId: id,
          senderId: req.user.id,
          senderRole: isBuyer ? 'BUYER' : 'SELLER',
          proposedPrice: price,
          proposedQty: qty,
          note: note || 'Counter offer'
        }
      }),
      prisma.notification.create({
        data: {
          userId: isBuyer ? quote.sellerId : quote.buyerId,
          title: 'Counter-Offer Received',
          message: `${req.user.name} submitted a counter-offer of ${price} ETB/${quote.unit} for ${qty} ${quote.unit}`,
          type: 'QUOTE',
          linkUrl: isBuyer ? '/dashboard/farmer/quotes' : '/dashboard/buyer/quotes'
        }
      })
    ])

    res.json({ message: 'Counter-offer sent successfully', quote: updatedQuote })
  } catch (err) {
    next(err)
  }
}

// Accept quote and atomically create confirmed order & reserve inventory!
export const acceptQuote = async (req, res, next) => {
  try {
    const { id } = req.params
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        product: true,
        buyer: { include: { buyerProfile: true } },
        seller: { include: { farmerProfile: true } }
      }
    })

    if (!quote) return res.status(404).json({ error: 'Quote not found' })

    // Buyer or Seller can accept agreed terms
    if (quote.buyerId !== req.user.id && quote.sellerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to accept this quote' })
    }

    if (quote.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'Quote has already been accepted and converted to an order' })
    }

    const agreedPrice = quote.offeredPrice || quote.requestedPrice
    const agreedQty = quote.requestedQty
    const subtotal = agreedPrice * agreedQty
    const deliveryFee = 3500.0 // Standard estimated regional haulage
    const totalAmount = subtotal + deliveryFee

    // Atomic execution with stock reservation
    const result = await prisma.$transaction(async (tx) => {
      // Check current stock
      const product = await tx.product.findUnique({ where: { id: quote.productId } })
      if (product.availableQty < agreedQty) {
        throw new Error(`Insufficient stock: Only ${product.availableQty} ${product.unit} available`)
      }

      // Deduct available stock & increment reserved
      await tx.product.update({
        where: { id: quote.productId },
        data: {
          availableQty: { decrement: agreedQty },
          reservedQty: { increment: agreedQty }
        }
      })

      // Mark quote as ACCEPTED
      const updatedQuote = await tx.quote.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          finalPrice: agreedPrice
        }
      })

      // Generate Order
      const orderNumber = 'ORD-' + Date.now().toString().slice(-6)
      const deliveryAddress = quote.buyer.buyerProfile?.deliveryAddress || `${quote.buyer.buyerProfile?.city || 'Addis Ababa'}, Ethiopia`

      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerId: quote.buyerId,
          sellerId: quote.sellerId,
          quoteId: quote.id,
          subtotal,
          deliveryFee,
          totalAmount,
          currency: quote.currency,
          status: 'CONFIRMED',