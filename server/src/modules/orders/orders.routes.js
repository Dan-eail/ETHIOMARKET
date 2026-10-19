import { Router } from 'express'
import {
  createDirectOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  repeatOrder,
  getOrderInvoice
} from './orders.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { requireKyc } from '../../middleware/requireKyc.js'

const router = Router()

router.use(authenticate)

router.post('/', requireKyc, createDirectOrder)
router.get('/', getOrders)
router.get('/:id', getOrderById)
router.get('/:id/invoice', getOrderInvoice)
router.post('/:id/repeat', repeatOrder)
router.patch('/:id/status', updateOrderStatus)

export default router
