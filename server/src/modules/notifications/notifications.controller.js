import prisma from '../../config/database.js'

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    res.json({ notifications })
  } catch (err) {
    next(err)
  }
}

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { read: true }
    })
    res.json({ message: 'Marked as read' })
  } catch (err) {
    next(err)
  }
}

export const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id },
      data: { read: true }
    })
    res.json({ message: 'All notifications marked as read' })
  } catch (err) {
    next(err)
  }
}
