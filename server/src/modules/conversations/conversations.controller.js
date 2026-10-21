import prisma from '../../config/database.js'

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: req.user.id },
          { participant2Id: req.user.id }
        ]
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    })

    // Populate other participant info
    const enriched = await Promise.all(conversations.map(async (c) => {
      const otherUserId = c.participant1Id === req.user.id ? c.participant2Id : c.participant1Id
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: { id: true, name: true, avatarUrl: true, isVerified: true, roles: true }
      })
      return {
        ...c,
        otherUser
      }
    }))

    res.json({ conversations: enriched })
  } catch (err) {
    next(err)
  }
}

export const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

    if (conversation.participant1Id !== req.user.id && conversation.participant2Id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this chat' })
    }

    res.json({ conversation })
  } catch (err) {
    next(err)
  }
}

export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params
    const { text } = req.body
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' })
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } })
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

    const recipientId = conversation.participant1Id === req.user.id
      ? conversation.participant2Id
      : conversation.participant1Id

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: id,
          senderId: req.user.id,
          text: text.trim(),
        }
      }),
      prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() }
      }),
      prisma.notification.create({
        data: {
          userId: recipientId,
          title: `New message from ${req.user.name}`,
          message: text.length > 60 ? `${text.slice(0, 60)}...` : text,
          type: 'SYSTEM',
          linkUrl: `/dashboard/messages/${id}`
        }
      })
    ])

    res.status(201).json({ message })
  } catch (err) {
    next(err)
  }
}
