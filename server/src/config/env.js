import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  jwtSecret: process.env.JWT_SECRET || 'ethiomarket_super_secret_jwt_key_2026_production_grade',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // Fayda e-KYC
  fayda: {
    authUrl: process.env.FAYDA_AUTH_URL || 'https://id.gov.et/authentication',
    tokenUrl: process.env.FAYDA_TOKEN_URL || 'https://partner.fayda.et/oauth2/token',
    clientId: process.env.FAYDA_CLIENT_ID || '',
    clientSecret: process.env.FAYDA_CLIENT_SECRET || '',
    redirectUri: process.env.FAYDA_REDIRECT_URI || 'http://localhost:5173/kyc/fayda/callback',
    kycStorageDir: process.env.KYC_STORAGE_DIR || './uploads/kyc_documents',
    isConfigured: () => Boolean(process.env.FAYDA_CLIENT_ID && process.env.FAYDA_CLIENT_SECRET)
  },

  // Chapa Payments
  chapa: {
    baseUrl: process.env.CHAPA_API_BASE_URL || 'https://api.chapa.co/v1',
    secretKey: process.env.CHAPA_SECRET_KEY || '',
    webhookSecret: process.env.CHAPA_WEBHOOK_SECRET || '',
    webhookUrl: process.env.CHAPA_WEBHOOK_URL || 'http://localhost:5000/api/v1/payments/webhook',
    returnUrl: process.env.CHAPA_RETURN_URL || 'http://localhost:5173/checkout/verify',
    environment: process.env.PAYMENT_ENVIRONMENT || 'test',
    isConfigured: () => Boolean(process.env.CHAPA_SECRET_KEY && process.env.CHAPA_SECRET_KEY.startsWith('CHASECK_'))
  }
}
