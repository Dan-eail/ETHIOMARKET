import test from 'node:test'
import assert from 'node:assert'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import prisma from '../config/database.js'
import bcrypt from 'bcryptjs'
import { config } from '../config/env.js'

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

  // Direct token generation for reliable test execution
  let adminToken = ''
  let unverifiedFarmerToken = jwt.sign({ userId: unverifiedFarmer.id }, config.jwtSecret, { expiresIn: '1d' })
  let verifiedFarmerToken = ''

  const resAdmin = await fetch(`${BASE_URL}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'ADMIN' })
  })
  const adminData = await resAdmin.json()
  adminToken = adminData.token

  const resFarmer = await fetch(`${BASE_URL}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'FARMER' })
  })
  const farmerData = await resFarmer.json()
  verifiedFarmerToken = farmerData.token

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

  let oidcState = ''
  await t.test('2. Fayda Session Initiation requires explicit consent', async () => {
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

  await t.test('3. Fayda Callback rejects invalid or expired state', async () => {
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
  })

  await t.test('4. Security: Cross-account state linking is rejected', async () => {
    // Attempting to redeem unverifiedFarmer's state with admin token
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

  await t.test('5. Valid Fayda Callback marks account as VERIFIED with FAYDA method', async () => {
    const res = await fetch(`${BASE_URL}/kyc/fayda/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unverifiedFarmerToken}`
      },
      body: JSON.stringify({
        state: oidcState,
        code: 'VALID_AUTH_CODE_2026',
        mockClaims: {
          fullName: 'Chala Gemechu',
          gender: 'MALE',
          dateOfBirth: '1990-04-18',
          faydaId: 'FIN-109283746520'
        }
      })
    })

    const data = await res.json()
    assert.strictEqual(res.status, 200)
    assert.strictEqual(data.success, true)
    assert.strictEqual(data.method, 'FAYDA')
    assert.strictEqual(data.status, 'VERIFIED')

    // Verify DB user is now verified
    const userInDb = await prisma.user.findUnique({ where: { id: unverifiedFarmer.id } })
    assert.strictEqual(userInDb.isVerified, true)
  })

  let manualRecordId = ''
  await t.test('6. Manual Review Fallback submission and duplicate prevention', async () => {
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

  await t.test('7. Admin Review: Approval requires mandatory reason and sets method to MANUAL_REVIEW', async () => {
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
