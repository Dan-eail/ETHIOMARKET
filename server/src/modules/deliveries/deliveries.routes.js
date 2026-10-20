import { Router } from 'express'
import {
  getAvailableDeliveries,
  getMyDeliveries,
  claimDelivery,
  verifyPickup,
  verifyDelivery,
  reportDelay,
  addDeliveryEvent,
  registerVehicle
} from './deliveries.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { requireKyc } from '../../middleware/requireKyc.js'

const router = Router()

router.use(authenticate)

router.get('/available', getAvailableDeliveries)
router.get('/my-jobs', authorize('TRANSPORTER', 'ADMIN'), getMyDeliveries)
router.post('/:id/claim', authorize('TRANSPORTER', 'ADMIN'), requireKyc, claimDelivery)
router.post('/:id/verify-pickup', authorize('TRANSPORTER', 'ADMIN'), verifyPickup)
router.post('/:id/verify-delivery', authorize('TRANSPORTER', 'ADMIN'), verifyDelivery)
router.post('/:id/report-delay', authorize('TRANSPORTER', 'ADMIN'), reportDelay)
router.post('/:id/events', authorize('TRANSPORTER', 'ADMIN'), addDeliveryEvent)
router.post('/vehicles', authorize('TRANSPORTER', 'ADMIN'), registerVehicle)

export default router
