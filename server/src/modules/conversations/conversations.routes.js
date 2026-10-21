import { Router } from 'express'
import { getConversations, getMessages, sendMessage } from './conversations.controller.js'
import { authenticate } from '../../middleware/authenticate.js'

const router = Router()

router.use(authenticate)

router.get('/', getConversations)
router.get('/:id', getMessages)
router.post('/:id/messages', sendMessage)

export default router
