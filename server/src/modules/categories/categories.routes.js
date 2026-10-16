import { Router } from 'express'
import { getCategories, createCategory } from './categories.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'

const router = Router()

router.get('/', getCategories)
router.post('/', authenticate, authorize('ADMIN'), createCategory)

export default router
