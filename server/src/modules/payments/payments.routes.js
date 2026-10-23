import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import {
  initializePayment,
  verifyPayment,
  handleWebhook,
  getPayments,
  getPaymentById,
  reconcilePayment,
  requestRefund,
  getReconciliationOverview
} from './payments.controller.js'

const router = Router()

// Public / Provider-facing Webhook Endpoint (Protected by HMAC signature, not JWT)
router.post('/webhook', handleWebhook)

// Authenticated Routes
router.use(authenticate)

router.post('/initialize', initializePayment)
router.get('/verify/:tx_ref', verifyPayment)
router.post('/verify/:tx_ref', verifyPayment)
router.get('/', getPayments)
router.get('/admin/overview', authorize('ADMIN'), getReconciliationOverview)
router.get('/:id', getPaymentById)
router.post('/:id/reconcile', authorize('ADMIN'), reconcilePayment)
router.post('/:id/refund', requestRefund)

export default router
