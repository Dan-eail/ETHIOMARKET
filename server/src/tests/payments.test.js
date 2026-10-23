import test from 'node:test'
import assert from 'node:assert'
import crypto from 'crypto'
import app from '../app.js'
import prisma from '../config/database.js'
import { config } from '../config/env.js'

let BASE_URL = ''

test('EthioMarket Chapa Payments, Webhooks, Reconciliation & Refund Tests', async (t) => {
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
    // Cleanup payments created during test
    await prisma.refundRecord.deleteMany({
      where: { refundReference: { contains: 'TEST' } }
    })
    await prisma.payment.deleteMany({
      where: { merchantReference: { contains: 'ETMPAY' } }
    })
    await prisma.webhookEvent.deleteMany({
      where: { provider: 'CHAPA' }
    })
  })

  let buyerToken = ''
  let farmerToken = ''
  let adminToken = ''
  let buyerUserId = ''
  let createdOrderId = ''
  let payableOrderAmount = 0
  let merchantReference = ''
  let createdPaymentId = ''

  // 1. Authenticate roles
  const resBuyer = await fetch(`${BASE_URL}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'BUYER' })
  })
  const buyerData = await resBuyer.json()
  buyerToken = buyerData.token
  buyerUserId = buyerData.user.id

  const resFarmer = await fetch(`${BASE_URL}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'FARMER' })
  })
  const farmerData = await resFarmer.json()
  farmerToken = farmerData.token

  const resAdmin = await fetch(`${BASE_URL}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'ADMIN' })
  })
  const adminData = await resAdmin.json()
  adminToken = adminData.token

  // Get a product to purchase
  const products = await prisma.product.findMany({ where: { status: 'PUBLISHED' } })
  const product = products[0]

  // Create an order for buyer
  const resOrder = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerToken}`
    },
    body: JSON.stringify({
      productId: product.id,
      quantity: 5,
      paymentMethod: 'CHAPA',
      deliveryAddress: 'Bole Medhanialem Logistics Depot, Addis Ababa'
    })
  })
  const orderData = await resOrder.json()
  assert.strictEqual(resOrder.status, 201)
  createdOrderId = orderData.order.id
  payableOrderAmount = orderData.order.totalAmount
  assert.strictEqual(orderData.order.isPaid, false)
  assert.strictEqual(orderData.order.paymentStatus, 'PENDING')

  await t.test('1. Payment initialization verifies order ownership and creates pending payment record', async () => {
    // Other user (farmer) cannot initialize payment for buyer's order
    const resForbidden = await fetch(`${BASE_URL}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`
      },
      body: JSON.stringify({ orderId: createdOrderId })
    })
    assert.strictEqual(resForbidden.status, 400)

    // Authorized buyer initializes
    const resInit = await fetch(`${BASE_URL}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        orderId: createdOrderId,
        idempotencyKey: `IDEMP-${Date.now()}`
      })
    })

    const initData = await resInit.json()
    assert.strictEqual(resInit.status, 201)
    assert.ok(initData.merchantReference)
    assert.ok(initData.checkoutUrl)
    assert.strictEqual(initData.amount, payableOrderAmount)
    assert.strictEqual(initData.currency, 'ETB')

    merchantReference = initData.merchantReference
    createdPaymentId = initData.paymentId

    // Verify DB payment is INITIATED
    const paymentInDb = await prisma.payment.findUnique({ where: { id: createdPaymentId } })
    assert.strictEqual(paymentInDb.status, 'INITIATED')
    assert.strictEqual(paymentInDb.amount, payableOrderAmount)
  })

  await t.test('2. Critical security check: Browser query parameters (?success=true) do NOT mark order as paid', async () => {
    // Verify order in database is still NOT paid
    const orderInDb = await prisma.order.findUnique({ where: { id: createdOrderId } })
    assert.strictEqual(orderInDb.isPaid, false)
    assert.notStrictEqual(orderInDb.paymentStatus, 'PAID')
  })

  await t.test('3. Server-side verification strictly validates amount and currency', async () => {
    // Amount mismatch simulation
    const resAmountMismatch = await fetch(`${BASE_URL}/payments/verify/${merchantReference}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        mockProviderData: {
          status: 'success',
          reference: 'CHAPA-MOCK-FAIL',
          amount: payableOrderAmount + 500, // Tampered amount!
          currency: 'ETB'
        }
      })
    })
    assert.strictEqual(resAmountMismatch.status, 400)
    const errData = await resAmountMismatch.json()
    assert.match(errData.error, /amount mismatch/i)

    // Currency mismatch simulation
    const resCurrencyMismatch = await fetch(`${BASE_URL}/payments/verify/${merchantReference}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        mockProviderData: {
          status: 'success',
          reference: 'CHAPA-MOCK-FAIL',
          amount: payableOrderAmount,
          currency: 'USD' // Tampered currency!
        }
      })
    })
    assert.strictEqual(resCurrencyMismatch.status, 400)
  })

  await t.test('4. Successful server-side verification confirms payment and transitions order to PAID', async () => {
    const resVerify = await fetch(`${BASE_URL}/payments/verify/${merchantReference}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        mockProviderData: {
          status: 'success',
          reference: `CHAPA-TRX-${Date.now()}`,
          amount: payableOrderAmount,
          currency: 'ETB',
          method: 'telebirr'
        }
      })
    })

    const verifyData = await resVerify.json()
    assert.strictEqual(resVerify.status, 200)
    assert.strictEqual(verifyData.verified, true)
    assert.strictEqual(verifyData.payment.status, 'SUCCESS')
    assert.strictEqual(verifyData.order.paymentStatus, 'PAID')
    assert.strictEqual(verifyData.order.isPaid, true)

    // Confirm in DB
    const orderInDb = await prisma.order.findUnique({ where: { id: createdOrderId } })
    assert.strictEqual(orderInDb.isPaid, true)
    assert.strictEqual(orderInDb.paymentStatus, 'PAID')
  })

  await t.test('5. Webhook processing: Validates HMAC-SHA256 signature and handles idempotency', async () => {
    // 1. Create a fresh order and payment for webhook test
    const newOrder = await prisma.order.create({
      data: {
        orderNumber: 'ORD-WH-' + Date.now().toString().slice(-5),
        buyerId: buyerUserId,
        sellerId: product.sellerId,
        subtotal: 10000,
        deliveryFee: 2500,
        totalAmount: 12500,
        currency: 'ETB',
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: 'CHAPA',
        deliveryAddressSnapshot: 'Addis Ababa'
      }
    })

    const whMerchantRef = `ETMPAY-${newOrder.orderNumber}-${Date.now().toString(36)}`
    await prisma.payment.create({
      data: {
        orderId: newOrder.id,
        buyerId: buyerUserId,
        merchantReference: whMerchantRef,
        amount: 12500,
        currency: 'ETB',
        status: 'INITIATED'
      }
    })

    const webhookSecret = config.chapa.webhookSecret || config.chapa.secretKey || 'chapa_wh_secret_local_dev'
    const webhookPayload = {
      event: 'charge.complete',
      tx_ref: whMerchantRef,
      reference: 'CHAPA-WH-TRX-001',
      status: 'success',
      amount: 12500,
      currency: 'ETB',
      method: 'cbebirr'
    }
    const rawBodyString = JSON.stringify(webhookPayload)
    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBodyString)
      .digest('hex')

    // Webhook with invalid signature should be rejected (400)
    const resInvalidSig = await fetch(`${BASE_URL}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-chapa-signature': 'invalid_signature_hex'
      },
      body: rawBodyString
    })
    assert.strictEqual(resInvalidSig.status, 400)

    // Webhook with valid signature should succeed
    const resValidSig = await fetch(`${BASE_URL}/payments/webhook`, {