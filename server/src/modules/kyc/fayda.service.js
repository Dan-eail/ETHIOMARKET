import crypto from 'crypto'
import { config } from '../../config/env.js'
import prisma from '../../config/database.js'

// In-memory or state cache for OIDC sessions (state -> { userId, nonce, codeVerifier, createdAt })
const pendingOidcStates = new Map()

// Clean up stale states every 15 minutes
setInterval(() => {
  const now = Date.now()
  for (const [state, session] of pendingOidcStates.entries()) {
    if (now - session.createdAt > 1000 * 60 * 15) {
      pendingOidcStates.delete(state)
    }
  }
}, 1000 * 60 * 15).unref()

export class FaydaService {
  /**
   * Check if live Fayda credentials and endpoints are configured
   */
  static isConfigured() {
    return config.fayda.isConfigured()
  }

  /**
   * Generate PKCE code_challenge and code_verifier
   */
  static generatePkce() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')
    return { codeVerifier, codeChallenge }
  }

  /**
   * Initiate Fayda OIDC Verification Session
   */
  static async initiateAuthSession({ userId, consentGiven }) {
    if (!consentGiven) {
      throw new Error('Explicit user consent is required before initiating Fayda identity verification.')
    }

    const state = crypto.randomBytes(24).toString('hex')
    const nonce = crypto.randomBytes(24).toString('hex')
    const { codeVerifier, codeChallenge } = this.generatePkce()

    // Store state with userId and security parameters
    pendingOidcStates.set(state, {
      userId,
      nonce,
      codeVerifier,
      createdAt: Date.now()
    })

    // Record initial KYC attempt in DB
    const attempt = await prisma.verificationRecord.create({
      data: {
        userId,
        method: 'FAYDA',
        status: 'IN_PROGRESS',
        attemptId: state,
        consentGiven: true,
        consentTimestamp: new Date(),
        userNotes: 'Initiated Fayda OIDC authorization session'
      }
    })

    if (!this.isConfigured()) {
      return {
        configured: false,
        attemptId: attempt.id,
        state,
        message: 'Fayda partner credentials (FAYDA_CLIENT_ID / FAYDA_CLIENT_SECRET) are unconfigured. To test in local sandbox mode, use the test callback endpoint or submit for manual review.',
        authUrl: null
      }
    }

    const authUrl = new URL(config.fayda.authUrl)
    authUrl.searchParams.set('client_id', config.fayda.clientId)
    authUrl.searchParams.set('redirect_uri', config.fayda.redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'openid profile fayda_id')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('nonce', nonce)
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    return {
      configured: true,
      attemptId: attempt.id,
      state,
      authUrl: authUrl.toString()
    }
  }

  /**
   * Handle Fayda OAuth2 Callback
   */
  static async handleCallback({ code, state, requestingUserId, mockClaims = null }) {
    const session = pendingOidcStates.get(state)
    if (!session) {
      throw new Error('Invalid or expired verification session state. Please restart Fayda verification.')
    }

    // Verify session belongs to the requesting user to prevent cross-account linking
    if (session.userId !== requestingUserId) {
      throw new Error('Security violation: Callback session state mismatch. Identity cannot be bound to another user account.')
    }

    pendingOidcStates.delete(state)

    let verifiedClaims = {}
    let providerRef = ''

    if (mockClaims) {
      // Used in validated test environments and sandbox runs
      verifiedClaims = mockClaims
      providerRef = `FAYDA-TEST-${Date.now()}`
    } else {
      if (!this.isConfigured()) {
        throw new Error('Fayda partner integration is unconfigured on this environment. Cannot process live code exchange.')
      }

      // Exchange code for tokens at Fayda Token Endpoint
      const tokenRes = await fetch(config.fayda.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${config.fayda.clientId}:${config.fayda.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.fayda.redirectUri,
          code_verifier: session.codeVerifier
        })
      })