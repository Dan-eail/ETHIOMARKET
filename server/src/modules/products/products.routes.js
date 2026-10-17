import { Router } from 'express'
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getFarmerListings,
  updateStock,
  matchSuppliers
} from './products.controller.js'
import { authenticate } from '../../middleware/authenticate.js'
import { optionalAuthenticate } from '../../middleware/optionalAuthenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { requireKyc } from '../../middleware/requireKyc.js'

const router = Router()

router.get('/', optionalAuthenticate, getProducts)
router.post('/match-suppliers', authenticate, matchSuppliers)
router.get('/farmer/my-listings', authenticate, authorize('FARMER'), getFarmerListings)
router.get('/:id', authenticate, getProductById)
router.post('/', authenticate, authorize('FARMER', 'ADMIN'), requireKyc, createProduct)
router.patch('/:id/stock', authenticate, authorize('FARMER', 'ADMIN'), updateStock)
router.patch('/:id', authenticate, updateProduct)

export default router
