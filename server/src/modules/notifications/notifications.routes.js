import { Router } from 'express'
import { getNotifications, markAsRead, markAllAsRead } from './notifications.controller.js'
import { authenticate } from '../../middleware/authenticate.js'

const router = Router()

router.use(authenticate)

router.get('/', getNotifications)
router.patch('/:id/read', markAsRead)
router.post('/read-all', markAllAsRead)

export default router
