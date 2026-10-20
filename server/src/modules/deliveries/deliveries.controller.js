import prisma from '../../config/database.js'

export const getAvailableDeliveries = async (req, res, next) => {
  try {
    const available = await prisma.delivery.findMany({
      where: {
        status: 'REQUESTED',
        transporterId: null
      },
      include: {
        order: {
          include: {
            items: true,
            seller: { select: { name: true, phone: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ deliveries: available })
  } catch (err) {
    next(err)
  }
}

export const getMyDeliveries = async (req, res, next) => {
  try {
    const transporter = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id }
    })

    if (!transporter) {
      return res.status(403).json({ error: 'Only registered transporters can view transport jobs' })
    }

    const deliveries = await prisma.delivery.findMany({
      where: { transporterId: transporter.id },
      include: {
        order: {
          include: {
            items: true,
            buyer: { select: { name: true, phone: true } },
            seller: { select: { name: true, phone: true } }
          }
        },
        vehicle: true,
        events: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    res.json({ deliveries })
  } catch (err) {
    next(err)
  }
}

export const claimDelivery = async (req, res, next) => {
  try {
    const { id } = req.params
    const { vehicleId } = req.body

    const transporter = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id },
      include: { vehicles: true }
    })

    if (!transporter) {
      return res.status(403).json({ error: 'Transporter profile required to claim jobs' })
    }

    const delivery = await prisma.delivery.findUnique({ where: { id } })
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' })

    if (delivery.transporterId !== null) {
      return res.status(409).json({ error: 'This delivery has already been claimed by another transporter' })
    }

    const assignedVehicleId = vehicleId || (transporter.vehicles[0]?.id || null)
    const pickupVerificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const deliveryVerificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const cargoSealNumber = 'ET-SEAL-' + Math.floor(10000 + Math.random() * 90000).toString()

    const updated = await prisma.$transaction([
      prisma.delivery.update({
        where: { id },
        data: {
          transporterId: transporter.id,
          vehicleId: assignedVehicleId,
          pickupVerificationCode,
          deliveryVerificationCode,
          cargoSealNumber,
          status: 'ASSIGNED',
          updatedAt: new Date()
        },
        include: { order: true, vehicle: true }
      }),
      prisma.deliveryEvent.create({
        data: {
          deliveryId: id,
          status: 'ASSIGNED',
          description: `Delivery job accepted by ${transporter.companyName}. Cargo Seal #${cargoSealNumber} assigned.`,
          location: delivery.pickupCity
        }
      }),
      prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'READY_FOR_PICKUP' }
      })
    ])

    res.json({ message: 'Delivery successfully claimed!', delivery: updated[0] })
  } catch (err) {
    next(err)
  }
}

export const verifyPickup = async (req, res, next) => {
  try {
    const { id } = req.params
    const { code } = req.body

    const transporter = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id }
    })

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { order: true }
    })
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' })

    if (delivery.transporterId !== transporter?.id && !req.userRoles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Only the assigned transporter can verify pickup' })
    }

    if (!code || delivery.pickupVerificationCode !== code.trim()) {
      return res.status(400).json({ error: 'Invalid pickup verification code. Obtain the 6-digit code from the farmer at pickup.' })
    }

    const [updatedDelivery, newEvent] = await prisma.$transaction([
      prisma.delivery.update({
        where: { id },
        data: {
          isPickupVerified: true,
          status: 'PICKED_UP',
          updatedAt: new Date()
        }
      }),
      prisma.deliveryEvent.create({
        data: {
          deliveryId: id,
          status: 'PICKED_UP',
          description: 'Farm pickup authenticated via secure verification code. Cargo loaded and verified.',
          location: delivery.pickupCity
        }
      }),
      prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'IN_TRANSIT' }
      }),
      prisma.notification.create({
        data: {
          userId: delivery.order.buyerId,
          title: 'Produce In Transit! 🚛',
          message: `Your order #${delivery.order.orderNumber} has been picked up from the farm and is on the way.`,
          type: 'DELIVERY',
          linkUrl: '/dashboard/buyer'
        }
      })
    ])

    res.json({ message: 'Farm pickup verified successfully! Cargo is now in transit.', delivery: updatedDelivery, event: newEvent })
  } catch (err) {
    next(err)
  }
}

export const verifyDelivery = async (req, res, next) => {
  try {
    const { id } = req.params
    const { code, proofOfDeliveryUrl } = req.body

    const transporter = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id }
    })

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { order: true }
    })
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' })

    if (delivery.transporterId !== transporter?.id && !req.userRoles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Only the assigned transporter can verify customer delivery' })
    }

    if (!code || delivery.deliveryVerificationCode !== code.trim()) {
      return res.status(400).json({ error: 'Invalid delivery code. Obtain the 6-digit code from the buyer upon handover.' })
    }

    const [updatedDelivery, newEvent] = await prisma.$transaction([
      prisma.delivery.update({
        where: { id },
        data: {
          isDeliveryVerified: true,
          status: 'DELIVERED',
          proofOfDeliveryUrl: proofOfDeliveryUrl || null,
          updatedAt: new Date()
        }
      }),
      prisma.deliveryEvent.create({
        data: {
          deliveryId: id,
          status: 'DELIVERED',
          description: 'Cargo handed over to buyer. Final delivery confirmed via secure handover code.',
          location: delivery.dropoffCity
        }
      }),
      prisma.order.update({
        where: { id: delivery.orderId },
        data: {
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          isPaid: true
        }
      }),
      prisma.notification.create({
        data: {
          userId: delivery.order.sellerId,
          title: 'Delivery Completed! 💰',
          message: `Order #${delivery.order.orderNumber} has been safely delivered and confirmed by buyer.`,
          type: 'DELIVERY',
          linkUrl: '/dashboard/farmer/orders'
        }
      }),
      prisma.notification.create({
        data: {
          userId: delivery.order.buyerId,
          title: 'Order Delivered! 📦',
          message: `Order #${delivery.order.orderNumber} delivered successfully. Thank you for trading on EthioMarket!`,
          type: 'DELIVERY',
          linkUrl: '/dashboard/buyer'
        }
      })
    ])

    res.json({ message: 'Delivery completed and verified! Order fulfilled.', delivery: updatedDelivery, event: newEvent })
  } catch (err) {
    next(err)
  }
}

export const reportDelay = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason, location } = req.body

    const transporter = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id }
    })

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { order: true }
    })
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' })

    if (delivery.transporterId !== transporter?.id && !req.userRoles.includes('ADMIN')) {
      return res.status(403).json({ error: 'Not authorized to report delay on this delivery' })
    }

    const [updatedDelivery, newEvent] = await prisma.$transaction([
      prisma.delivery.update({
        where: { id },
        data: {
          reportedDelayReason: reason,
          updatedAt: new Date()
        }
      }),
      prisma.deliveryEvent.create({
        data: {
          deliveryId: id,
          status: delivery.status,
          description: `Transit notice / delay reported: ${reason}`,
          location: location || delivery.dropoffCity
        }
      }),
      prisma.notification.create({
        data: {
          userId: delivery.order.buyerId,
          title: 'Transit Update on Your Order ⚠️',
          message: `Transporter reported a transit notice: ${reason}`,
          type: 'DELIVERY',
          linkUrl: '/dashboard/buyer'
        }
      })
    ])
