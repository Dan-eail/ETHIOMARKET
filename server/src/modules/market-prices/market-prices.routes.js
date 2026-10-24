import { Router } from 'express'
import { getMarketPrices } from './market-prices.controller.js'

const router = Router()

router.get('/', getMarketPrices)

export default router
