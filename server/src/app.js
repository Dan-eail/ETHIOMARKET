import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { config } from './config/env.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

// Import Routes
import authRoutes from './modules/auth/auth.routes.js'
import categoriesRoutes from './modules/categories/categories.routes.js'
import productsRoutes from './modules/products/products.routes.js'
import quotesRoutes from './modules/quotes/quotes.routes.js'
import ordersRoutes from './modules/orders/orders.routes.js'
import deliveriesRoutes from './modules/deliveries/deliveries.routes.js'
import adminRoutes from './modules/admin/admin.routes.js'
import notificationsRoutes from './modules/notifications/notifications.routes.js'
import conversationsRoutes from './modules/conversations/conversations.routes.js'
import marketPricesRoutes from './modules/market-prices/market-prices.routes.js'
import favoritesRoutes from './modules/favorites/favorites.routes.js'
import kycRoutes from './modules/kyc/kyc.routes.js'
import paymentsRoutes from './modules/payments/payments.routes.js'

const app = express()

// Security & Utility Middlewares
app.use(helmet())
app.use(cors({
  origin: config.clientOrigin || '*',
  credentials: true
}))
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))
app.use(express.urlencoded({ extended: true }))
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'))
}

// Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',