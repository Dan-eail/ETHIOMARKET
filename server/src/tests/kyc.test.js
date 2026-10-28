import test from 'node:test'
import assert from 'node:assert'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import app from '../app.js'
import prisma from '../config/database.js'
import bcrypt from 'bcryptjs'
import { config } from '../config/env.js'
import { FaydaService } from '../modules/kyc/fayda.service.js'

let BASE_URL = ''

test('EthioMarket KYC & Identity Verification Tests', async (t) => {
  let serverInstance
  await new Promise((resolve) => {
    serverInstance = app.listen(0, '127.0.0.1', () => {
      const port = serverInstance.address().port
      BASE_URL = `http://127.0.0.1:${port}/api/v1`
      resolve()
    })
  })
  t.after(async () => {
    serverInstance.close()
    // Cleanup any test-created records
    await prisma.verificationRecord.deleteMany({
      where: { userNotes: { contains: 'TEST_KYC' } }
    })
  })

  const passwordHash = await bcrypt.hash('Password123!', 10)

  // 1. Setup unverified farmer test user safely
  let unverifiedFarmer = await prisma.user.findFirst({
    where: { OR: [{ email: 'unverified_farmer@ethiomarket.et' }, { phone: '+251911998877' }] }
  })
  if (unverifiedFarmer) {
    unverifiedFarmer = await prisma.user.update({
      where: { id: unverifiedFarmer.id },
      data: { isVerified: false, status: 'ACTIVE', email: 'unverified_farmer@ethiomarket.et' }
    })
  } else {
    unverifiedFarmer = await prisma.user.create({
      data: {
        email: 'unverified_farmer@ethiomarket.et',
        phone: `+251911${Date.now().toString().slice(-6)}`,
        name: 'Unverified Farmer Chala',
        passwordHash,
        isVerified: false,
        status: 'ACTIVE',
        roles: { create: [{ role: 'FARMER', isPrimary: true }] },
        farmerProfile: {
          create: {
            farmName: 'Bishoftu Highlands',
            region: 'Oromia',
            woreda: 'Bishoftu'
          }
        }
      }
    })
  }

  // Clean up any stale verification records for the test user
  await prisma.verificationRecord.deleteMany({
    where: { userId: unverifiedFarmer.id }
  })

  let adminToken = ''
  let unverifiedFarmerToken = jwt.sign({ userId: unverifiedFarmer.id }, config.jwtSecret, { expiresIn: '1d' })

  const resAdmin = await fetch(`${BASE_URL}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'ADMIN' })
  })
  const adminData = await resAdmin.json()
  adminToken = adminData.token

  await t.test('1. Backend enforces KYC restriction: Unverified farmer cannot create listings', async () => {
    const categories = await prisma.category.findMany()
    const categoryId = categories[0]?.id

    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unverifiedFarmerToken}`
      },
      body: JSON.stringify({
        title: 'Unverified Producer Teff',
        categoryId,
        description: 'Quality grain produce from unverified account',
        unit: 'QUINTAL',
        pricePerUnit: 8500,
        availableQty: 50,
        region: 'Oromia',
        city: 'Bishoftu'
      })
    })

    const data = await res.json()
    assert.strictEqual(res.status, 403)
    assert.strictEqual(data.code, 'KYC_REQUIRED')
    assert.strictEqual(data.isVerified, false)
  })

  await t.test('2. Diagnostic reporting: Returns CONFIGURATION_REQUIRED when provider credentials unconfigured', async () => {
    const res = await fetch(`${BASE_URL}/kyc/fayda/diagnostics`, {
      headers: { Authorization: `Bearer ${unverifiedFarmerToken}` }
    })
    const data = await res.json()
    assert.strictEqual(res.status, 200)
    assert.strictEqual(data.provider, 'Fayda National ID Program (eSignet / MOSIP OIDC 1.0)')
    assert.ok(data.status === 'CONFIGURATION_REQUIRED' || data.status === 'LIVE_CONFIGURED')
    assert.ok(data.documentation.includes('partner.fayda.et'))
  })

  let oidcState = ''
  await t.test('3. Fayda Session Initiation requires explicit citizen consent', async () => {
    // Attempt without consent
    const resNoConsent = await fetch(`${BASE_URL}/kyc/fayda/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unverifiedFarmerToken}`
      },
      body: JSON.stringify({ consentGiven: false })
    })
    assert.strictEqual(resNoConsent.status, 400)
    const noConsentData = await resNoConsent.json()
    assert.match(noConsentData.error, /consent/i)

    // With explicit consent
    const resConsent = await fetch(`${BASE_URL}/kyc/fayda/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unverifiedFarmerToken}`
      },
      body: JSON.stringify({ consentGiven: true })
    })
    const consentData = await resConsent.json()
    assert.strictEqual(resConsent.status, 200)
    assert.ok(consentData.state)
    assert.ok(consentData.attemptId)
    oidcState = consentData.state
  })

  await t.test('4. Security: Callback rejects invalid or expired state', async () => {
    const res = await fetch(`${BASE_URL}/kyc/fayda/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unverifiedFarmerToken}`
      },
      body: JSON.stringify({
        state: 'invalid-non-existent-state-12345',
        code: 'some_code'
      })
    })
    assert.strictEqual(res.status, 400)
    const data = await res.json()
    assert.match(data.error, /invalid or expired/i)
  })

  await t.test('5. Security: Cross-account state hijacking is strictly rejected', async () => {
    // Attempting to redeem unverifiedFarmer's state using admin token
    const res = await fetch(`${BASE_URL}/kyc/fayda/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        state: oidcState,
        code: 'code123'
      })
    })
    const data = await res.json()
    assert.strictEqual(res.status, 400)
    assert.match(data.error, /mismatch/i)
  })

  await t.test('6. Security: Unconfigured provider rejects token exchange and does not pretend verification', async () => {
    // When credentials unconfigured in .env, callback must reject and NOT mark verified
    const res = await fetch(`${BASE_URL}/kyc/fayda/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unverifiedFarmerToken}`
      },
      body: JSON.stringify({
        state: oidcState,
        code: 'VALID_AUTH_CODE_2026'
      })
    })
    const data = await res.json()
    assert.strictEqual(res.status, 400)
    assert.match(data.error, /unconfigured/i)

    // Verify user is still NOT verified
    const userInDb = await prisma.user.findUnique({ where: { id: unverifiedFarmer.id } })
    assert.strictEqual(userInDb.isVerified, false)
  })

  await t.test('7. Security: Replay attack prevention (state cannot be consumed twice)', async () => {
    // Re-attempting to use oidcState should fail because it was deleted on first consumption
    const res = await fetch(`${BASE_URL}/kyc/fayda/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unverifiedFarmerToken}`
      },
      body: JSON.stringify({
        state: oidcState,
        code: 'VALID_AUTH_CODE_2026'
      })
    })
    assert.strictEqual(res.status, 400)
    const data = await res.json()
    assert.match(data.error, /invalid or expired/i)
  })

  await t.test('8. OIDC Cryptographic Claims Validation: Nonce mismatch is rejected', async () => {
    const sessionRes = await FaydaService.initiateAuthSession({
      userId: unverifiedFarmer.id,
      consentGiven: true
    })

    // Mock provider transport returning an ID token with mismatched nonce
    const fakeIdToken = jwt.sign(
      {
        sub: 'FIN-1029384756',
        name: 'Chala Gemechu',
        gender: 'MALE',
        birthdate: '1992-05-14',
        nonce: 'attacker_controlled_wrong_nonce',
        exp: Math.floor(Date.now() / 1000) + 3600
      },
      'test_secret'
    )

    await assert.rejects(
      async () => {
        await FaydaService.handleCallback({
          code: 'test_code_123',
          state: sessionRes.state,
          requestingUserId: unverifiedFarmer.id,
          _testTransport: async () => ({ id_token: fakeIdToken })
        })
      },
      {
        message: /nonce does not match/i
      }
    )
  })

  await t.test('9. OIDC Cryptographic Claims Validation: Expired ID token is rejected', async () => {
    const sessionRes = await FaydaService.initiateAuthSession({
      userId: unverifiedFarmer.id,
      consentGiven: true
    })

    // ID token with exp in the past
    const expiredIdToken = jwt.sign(
      {
        sub: 'FIN-1029384756',
        name: 'Chala Gemechu',
        gender: 'MALE',
        birthdate: '1992-05-14',
        exp: Math.floor(Date.now() / 1000) - 300 // 5 minutes ago
      },
      'test_secret'
    )

    await assert.rejects(
      async () => {
        await FaydaService.handleCallback({
          code: 'test_code_123',
          state: sessionRes.state,
          requestingUserId: unverifiedFarmer.id,
          _testTransport: async () => ({ id_token: expiredIdToken })
        })
      },
      {
        message: /expired/i
      }
    )
  })

  await t.test('10. Valid Fayda OIDC Token Exchange marks user VERIFIED and updates role badges', async () => {
    const sessionRes = await FaydaService.initiateAuthSession({
      userId: unverifiedFarmer.id,
      consentGiven: true
    })

    // Find the session to sign with matching nonce
    const result = await FaydaService.handleCallback({
      code: 'official_auth_code_9988',
      state: sessionRes.state,
      requestingUserId: unverifiedFarmer.id,
      _testTransport: async ({ session }) => {
        const id_token = jwt.sign(
          {
            sub: 'FIN-998877665544',
            name: 'Chala Gemechu FaydaVerified',
            gender: 'MALE',
            birthdate: '1990-08-20',
            nonce: session.nonce,
            exp: Math.floor(Date.now() / 1000) + 3600
          },
          'test_secret'
        )
        return {
          access_token: 'at_test_token_sample',
          id_token,
          token_type: 'Bearer',
          expires_in: 3600
        }
      }
    })

    assert.strictEqual(result.success, true)
    assert.strictEqual(result.method, 'FAYDA')
    assert.strictEqual(result.status, 'VERIFIED')

    // Confirm DB user and farmerProfile are marked verified
    const dbUser = await prisma.user.findUnique({
      where: { id: unverifiedFarmer.id },
      include: { farmerProfile: true }
    })
    assert.strictEqual(dbUser.isVerified, true)
    assert.strictEqual(dbUser.farmerProfile.verifiedBadge, true)

    // Confirm audit log was created
    const audit = await prisma.auditLog.findFirst({
      where: { userId: unverifiedFarmer.id, action: 'FAYDA_KYC_VERIFIED' }
    })
    assert.ok(audit)
  })

  await t.test('11. Security: Normal user cannot alter KYC verification status directly', async () => {
    const res = await fetch(`${BASE_URL}/admin/users/${unverifiedFarmer.id}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unverifiedFarmerToken}`
      },
      body: JSON.stringify({ isVerified: true })
    })
    // Non-admin must be rejected
    assert.strictEqual(res.status, 403)
  })

  let manualRecordId = ''
  await t.test('12. Manual Review Fallback submission and duplicate prevention', async () => {
    // Reset user to unverified for testing manual fallback
    await prisma.user.update({
      where: { id: unverifiedFarmer.id },
      data: { isVerified: false }
    })
    await prisma.verificationRecord.deleteMany({
      where: { userId: unverifiedFarmer.id }
    })

    const resSubmit = await fetch(`${BASE_URL}/kyc/manual/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unverifiedFarmerToken}`
      },
      body: JSON.stringify({
        documentType: 'KEBELE_ID',
        documentNumber: 'KB-882910',
        userNotes: 'TEST_KYC submission from highland cooperative',
        consentGiven: true
      })
    })

    const submitData = await resSubmit.json()
    assert.strictEqual(resSubmit.status, 201)
    assert.strictEqual(submitData.record.method, 'MANUAL_REVIEW')
    assert.strictEqual(submitData.record.status, 'PENDING_REVIEW')
    manualRecordId = submitData.record.id

    // Attempting duplicate submission should be rejected
    const resDuplicate = await fetch(`${BASE_URL}/kyc/manual/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unverifiedFarmerToken}`
      },
      body: JSON.stringify({
        documentType: 'PASSPORT',
        documentNumber: 'EP123456',
        consentGiven: true
      })
    })
    assert.strictEqual(resDuplicate.status, 400)
    const dupData = await resDuplicate.json()
    assert.match(dupData.error, /pending verification review/i)
  })

  await t.test('13. Admin Review: Approval requires mandatory reason and sets method explicitly to MANUAL_REVIEW', async () => {
    // Approve without reason should fail
    const resNoReason = await fetch(`${BASE_URL}/kyc/manual/${manualRecordId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ decisionReason: 'ok' }) // Less than 5 chars
    })
    assert.strictEqual(resNoReason.status, 400)

    // Approve with proper reason
    const resApprove = await fetch(`${BASE_URL}/kyc/manual/${manualRecordId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        decisionReason: 'Kebele identification verified against regional cooperative agricultural registry.'
      })
    })
    const approveData = await resApprove.json()
    assert.strictEqual(resApprove.status, 200)
    assert.strictEqual(approveData.record.status, 'VERIFIED')
    assert.strictEqual(approveData.record.method, 'MANUAL_REVIEW') // Critical: never falsely reported as FAYDA

    // Check user is now verified
    const userInDb = await prisma.user.findUnique({ where: { id: unverifiedFarmer.id } })
    assert.strictEqual(userInDb.isVerified, true)
  })
})
