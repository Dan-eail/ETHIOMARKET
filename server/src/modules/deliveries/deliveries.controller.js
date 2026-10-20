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