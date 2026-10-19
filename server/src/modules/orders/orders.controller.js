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
    })
  } catch (err) {
    next(err)
  }
}

export const getOrders = async (req, res, next) => {
  try {
    const roleFilter = req.query.as === 'seller' ? { sellerId: req.user.id } :
                       req.query.as === 'buyer' ? { buyerId: req.user.id } :
                       { OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }] }

    const orders = await prisma.order.findMany({
      where: roleFilter,
      include: {
        items: true,
        buyer: { select: { id: true, name: true, phone: true } },
        seller: { select: { id: true, name: true, phone: true } },
        delivery: {
          include: {
            transporter: { select: { companyName: true, rating: true } },
            events: { orderBy: { timestamp: 'desc' } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ orders })
  } catch (err) {
    next(err)
  }
}

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        buyer: { select: { id: true, name: true, phone: true, buyerProfile: true } },
        seller: { select: { id: true, name: true, phone: true, farmerProfile: true } },
        delivery: {
          include: {
            transporter: { include: { user: { select: { name: true, phone: true } } } },
            vehicle: true,
            events: { orderBy: { timestamp: 'asc' } }
          }
        },
        review: true
      }
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })

    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id && !req.userRoles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Not authorized to view this order' })
    }

    res.json({ order })
  } catch (err) {
    next(err)
  }
}

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
    }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) return res.status(404).json({ error: 'Order not found' })

    // Check authority: Seller, Admin, or Transporter
    const isSeller = order.sellerId === req.user.id
    const isAdmin = req.userRoles.includes('ADMIN')

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ error: 'Only the producer or admin can update order processing status' })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status, updatedAt: new Date() },
      include: { items: true, buyer: true }
    })

    // If delivered, release reserved stock
    if (status === 'DELIVERED') {
      const items = await prisma.orderItem.findMany({ where: { orderId: id } })
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { reservedQty: { decrement: item.quantity } }
        }).catch(e => console.error(e))
      }
    }

    res.json({ message: `Order marked as ${status}`, order: updated })
  } catch (err) {
    next(err)
  }
}

export const repeatOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const original = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    })

    if (!original) return res.status(404).json({ error: 'Order not found' })
    if (original.buyerId !== req.user.id && !req.userRoles.includes('ADMIN')) {
      return res.status(403).json({ error: 'You can only repeat your own orders' })
    }

    if (!original.items || original.items.length === 0) {
      return res.status(400).json({ error: 'Original order has no items' })
    }

    const firstItem = original.items[0]
    const product = await prisma.product.findUnique({ where: { id: firstItem.productId } })
    if (!product) return res.status(404).json({ error: 'Original produce listing is no longer available' })

    if (product.availableQty < firstItem.quantity) {
      return res.status(400).json({
        error: `Insufficient stock to repeat order. Requested: ${firstItem.quantity} ${product.unit}, Available: ${product.availableQty} ${product.unit}`
      })
    }

    const subtotal = product.pricePerUnit * firstItem.quantity
    const deliveryFee = original.deliveryFee || 2500
    const totalAmount = subtotal + deliveryFee
    const orderNumber = 'ORD-' + Date.now().toString().slice(-6)
    const invoiceNumber = 'INV-' + orderNumber.replace('ORD-', '')

    const newOrder = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: {
          availableQty: { decrement: firstItem.quantity },
          reservedQty: { increment: firstItem.quantity }
        }
      })

      const ord = await tx.order.create({
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
          paymentStatus: 'CASH_ON_DELIVERY',
          paymentMethod: 'CASH_ON_DELIVERY',
          deliveryAddressSnapshot: original.deliveryAddressSnapshot,
          notes: `Repeat of Order #${original.orderNumber}`,
          items: {
            create: [
              {
                productId: product.id,
                productName: product.title,
                productUnit: product.unit,
                quantity: firstItem.quantity,
                unitPrice: product.pricePerUnit,
                totalPrice: subtotal
              }
            ]
          }
        },
        include: { items: true }
      })

      const deliveryNumber = 'DEL-' + Date.now().toString().slice(-6)
      await tx.delivery.create({
        data: {
          deliveryNumber,
          orderId: ord.id,
          pickupRegion: product.region,
          pickupCity: product.city,
          pickupAddress: product.specificLocation || `${product.city} Agricultural Depot`,
          dropoffRegion: 'Addis Ababa',
          dropoffCity: 'Addis Ababa',
          dropoffAddress: original.deliveryAddressSnapshot,
          cargoWeightQuintals: product.unit === 'QUINTAL' ? firstItem.quantity : (firstItem.quantity / 100),
          deliveryFee,
          status: 'REQUESTED',
          recipientName: req.user.name,
          recipientPhone: req.user.phone
        }
      })

      return ord
    })

    res.status(201).json({ message: 'Order repeated successfully', order: newOrder })
  } catch (err) {
    next(err)
  }
}

export const getOrderInvoice = async (req, res, next) => {
  try {
    const { id } = req.params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        buyer: { select: { id: true, name: true, email: true, phone: true, buyerProfile: true } },
        seller: { select: { id: true, name: true, email: true, phone: true, farmerProfile: true } },
        delivery: true
      }
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })

    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id && !req.userRoles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Not authorized to view invoice for this order' })
    }

    const vatRate = 0.15 // Ethiopian standard VAT rate 15%
    const vatAmount = Math.round(order.subtotal * vatRate * 100) / 100
    const grandTotal = Math.round((order.totalAmount + vatAmount) * 100) / 100

    const invoice = {
      invoiceNumber: order.invoiceNumber || ('INV-' + order.orderNumber.replace('ORD-', '')),
      orderNumber: order.orderNumber,
      issueDate: order.createdAt,
      currency: order.currency,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      buyer: {
        name: order.buyer.name,
        company: order.buyer.buyerProfile?.businessName || order.buyer.name,
        phone: order.buyer.phone,
        email: order.buyer.email,
        address: order.deliveryAddressSnapshot,
        tin: order.buyer.buyerProfile?.tinNumber || 'TIN-009482103'
      },
      seller: {
        name: order.seller.name,
        farmName: order.seller.farmerProfile?.farmName || `${order.seller.name} Agricultural Enterprise`,
        phone: order.seller.phone,
        email: order.seller.email,
        region: order.seller.farmerProfile?.region || 'Oromia, Ethiopia',
        tin: 'TIN-008129384'
      },
      lineItems: order.items.map(item => ({
        description: item.productName,
        quantity: item.quantity,
        unit: item.productUnit,
        unitPrice: item.unitPrice,
        total: item.totalPrice
      })),
      financials: {
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        vatRatePercentage: 15,
        vatAmount,
        grandTotal
      }
    }

    res.json({ invoice })
  } catch (err) {
    next(err)
  }
}
