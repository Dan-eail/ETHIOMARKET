import { Router } from 'express'
import {
  createQuote,
  getQuotes,
  getQuoteById,
  counterQuote,
  acceptQuote
} from './quotes.controller.js'
import { authenticate } from '../../middleware/authenticate.js'

const router = Router()

router.use(authenticate)

router.post('/', createQuote)
router.get('/', getQuotes)
router.get('/:id', getQuoteById)
router.post('/:id/counter', counterQuote)
router.post('/:id/accept', acceptQuote)

export default router
