import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import {
  getKycStatus,
  initiateFaydaSession,
  handleFaydaCallback,
  getFaydaDiagnostics,
  submitManualReview,
  getAdminReviewQueue,
  approveManualReview,
  rejectManualReview,
  requestManualReviewInfo,
  streamDocumentFile
} from './kyc.controller.js'

const router = Router()

router.use(authenticate)

// User-facing KYC routes
router.get('/status', getKycStatus)
router.get('/fayda/diagnostics', getFaydaDiagnostics)
router.post('/fayda/initiate', initiateFaydaSession)
router.post('/fayda/callback', handleFaydaCallback)
router.post('/manual/submit', submitManualReview)
router.get('/documents/:id', streamDocumentFile)

// Admin-facing KYC operations
router.get('/manual/queue', authorize('ADMIN'), getAdminReviewQueue)
router.post('/manual/:id/approve', authorize('ADMIN'), approveManualReview)
router.post('/manual/:id/reject', authorize('ADMIN'), rejectManualReview)
router.post('/manual/:id/request-info', authorize('ADMIN'), requestManualReviewInfo)

export default router
