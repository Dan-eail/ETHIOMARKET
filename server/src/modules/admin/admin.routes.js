import { Router } from 'express'
import {
  getPlatformStats,
  getAllUsers,
  verifyUser,
  updateUserStatus,
  getAuditLogs
} from './admin.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

router.get('/stats', getPlatformStats)
router.get('/users', getAllUsers)
router.patch('/users/:id/verify', verifyUser)
router.patch('/users/:id/status', updateUserStatus)
router.get('/audit-logs', getAuditLogs)

export default router
