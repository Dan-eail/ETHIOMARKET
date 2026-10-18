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