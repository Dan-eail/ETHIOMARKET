import prisma from '../../config/database.js'
import { z } from 'zod'

const directOrderSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'CHAPA', 'TELEBIRR', 'CBE_BIRR', 'BANK_TRANSFER']).default('CASH_ON_DELIVERY'),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  notes: z.string().optional(),
})

export const createDirectOrder = async (req, res, next) => {
  try {
    const validated = directOrderSchema.parse(req.body)

    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
      include: { seller: true }
    })

    if (!product) return res.status(404).json({ error: 'Product not found' })
    if (product.sellerId === req.user.id) {
      return res.status(400).json({ error: 'You cannot purchase your own product' })
    }

    if (validated.quantity < product.minOrderQty) {
      return res.status(400).json({
        error: `Minimum order quantity is ${product.minOrderQty} ${product.unit}`
      })
    }

    if (validated.quantity > product.availableQty) {
      return res.status(400).json({
        error: `Requested quantity exceeds available stock (${product.availableQty} ${product.unit})`
      })
    }

    const subtotal = product.pricePerUnit * validated.quantity
    const deliveryFee = 2500.0 // Standard logistics estimate
    const totalAmount = subtotal + deliveryFee
    const orderNumber = 'ORD-' + Date.now().toString().slice(-6)
    const invoiceNumber = 'INV-' + orderNumber.replace('ORD-', '')

    // Execute atomic transaction reserving stock and generating order
    const result = await prisma.$transaction(async (tx) => {
      // Deduct stock
      await tx.product.update({
        where: { id: product.id },
        data: {
          availableQty: { decrement: validated.quantity },
          reservedQty: { increment: validated.quantity }
        }
      })

      const order = await tx.order.create({
        data: {
          orderNumber,
          invoiceNumber,
          buyerId: req.user.id,
          sellerId: product.sellerId,
          subtotal,
          deliveryFee,
          totalAmount,
          currency: product.currency,
          status: 'CONFIRMED',
          paymentStatus: validated.paymentMethod === 'CASH_ON_DELIVERY' ? 'CASH_ON_DELIVERY' : 'PENDING',
          paymentMethod: validated.paymentMethod,
          isPaid: false,
          deliveryAddressSnapshot: validated.deliveryAddress,
          notes: validated.notes,
          items: {
            create: [
              {
                productId: product.id,
                productName: product.title,
                productUnit: product.unit,
                quantity: validated.quantity,
                unitPrice: product.pricePerUnit,
                totalPrice: subtotal
              }
            ]
          }
        },
        include: {
          items: true
        }
      })

      // Delivery job created for transporters to claim
      const deliveryNumber = 'DEL-' + Date.now().toString().slice(-6)
      await tx.delivery.create({
        data: {
          deliveryNumber,
          orderId: order.id,
          pickupRegion: product.region,
          pickupCity: product.city,
          pickupAddress: product.specificLocation || `${product.city} Agricultural Depot`,
          dropoffRegion: req.user.buyerProfile?.region || 'Addis Ababa',
          dropoffCity: req.user.buyerProfile?.city || 'Addis Ababa',
          dropoffAddress: validated.deliveryAddress,
          cargoWeightQuintals: product.unit === 'QUINTAL' ? validated.quantity : (validated.quantity / 100),
          deliveryFee,
          status: 'REQUESTED',
          recipientName: req.user.name,
          recipientPhone: req.user.phone,
        }
      })

      // Notify seller
      await tx.notification.create({
        data: {
          userId: product.sellerId,
          title: 'New Confirmed Order! 📦',
          message: `${req.user.name} placed order #${orderNumber} for ${validated.quantity} ${product.unit} of ${product.title}`,
          type: 'ORDER',
          linkUrl: '/dashboard/farmer/orders'
        }
      })

      return order
    })

    res.status(201).json({
      message: 'Order created successfully',
      order: result