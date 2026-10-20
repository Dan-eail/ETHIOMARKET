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