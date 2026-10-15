import { Router } from 'express'
import { register, login, getMe, demoLogin } from './auth.controller.js'
import { authenticate } from '../../middleware/authenticate.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/demo-login', demoLogin)
router.get('/me', authenticate, getMe)

export default router
