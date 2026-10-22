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