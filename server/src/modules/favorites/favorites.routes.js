import { Router } from 'express'
import { getFavorites, toggleFavorite } from './favorites.controller.js'
import { authenticate } from '../../middleware/authenticate.js'

const router = Router()

router.use(authenticate)

router.get('/', getFavorites)
router.post('/:productId', toggleFavorite)

export default router
