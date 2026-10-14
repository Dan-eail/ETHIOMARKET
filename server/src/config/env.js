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