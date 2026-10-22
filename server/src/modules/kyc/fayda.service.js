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
