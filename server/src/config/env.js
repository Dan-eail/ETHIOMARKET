import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  jwtSecret: process.env.JWT_SECRET || 'ethiomarket_super_secret_jwt_key_2026_production_grade',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // Fayda National ID e-KYC (eSignet / OIDC 1.0)
  fayda: {
    authUrl: (process.env.FAYDA_AUTH_URL || 'https://id.gov.et/authentication').replace(/^"|"$/g, '').trim(),
    tokenUrl: (process.env.FAYDA_TOKEN_URL || 'https://partner.fayda.et/oauth2/token').replace(/^"|"$/g, '').trim(),
    userInfoUrl: (process.env.FAYDA_USERINFO_URL || 'https://partner.fayda.et/oauth2/userinfo').replace(/^"|"$/g, '').trim(),
    jwksUrl: (process.env.FAYDA_JWKS_URL || 'https://partner.fayda.et/oauth2/jwks').replace(/^"|"$/g, '').trim(),
    issuer: (process.env.FAYDA_ISSUER || 'https://id.gov.et').replace(/^"|"$/g, '').trim(),
    clientId: (process.env.FAYDA_CLIENT_ID || '').replace(/^"|"$/g, '').trim(),
    clientSecret: (process.env.FAYDA_CLIENT_SECRET || '').replace(/^"|"$/g, '').trim(),
    redirectUri: (process.env.FAYDA_REDIRECT_URI || 'http://localhost:5173/kyc/fayda/callback').replace(/^"|"$/g, '').trim(),
    kycStorageDir: (process.env.KYC_STORAGE_DIR || './uploads/kyc_documents').replace(/^"|"$/g, '').trim(),
    isConfigured: () => {
      const cid = (process.env.FAYDA_CLIENT_ID || '').replace(/^"|"$/g, '').trim()
      const csec = (process.env.FAYDA_CLIENT_SECRET || '').replace(/^"|"$/g, '').trim()
      return Boolean(cid && csec && cid !== 'your_fayda_client_id' && csec !== 'your_fayda_client_secret')
    }
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
