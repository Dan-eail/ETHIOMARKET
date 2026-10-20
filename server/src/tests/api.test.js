import test from 'node:test'
import assert from 'node:assert'
import app from '../app.js'
import prisma from '../config/database.js'

// We will use native fetch with a running or test server
let BASE_URL = ''

test('EthioMarket Core API & Business Workflow Tests', async (t) => {
  let serverInstance
  await new Promise((resolve) => {
    serverInstance = app.listen(0, '127.0.0.1', () => {
      const port = serverInstance.address().port
      BASE_URL = `http://127.0.0.1:${port}/api/v1`
      resolve()
    })
  })
  t.after(() => {
    serverInstance.close()
  })

  let farmerToken = ''
  let buyerToken = ''
  let transporterToken = ''
  let adminToken = ''
  let createdProductId = ''
  let quoteId = ''
  let orderId = ''

  await t.test('1. Demo Logins for All Roles', async () => {
    // Farmer
    const resFarmer = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'FARMER' })
    })
    const farmerData = await resFarmer.json()
    assert.strictEqual(resFarmer.status, 200)
    assert.ok(farmerData.token)
    farmerToken = farmerData.token

    // Buyer
    const resBuyer = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'BUYER' })
    })
    const buyerData = await resBuyer.json()
    assert.strictEqual(resBuyer.status, 200)
    assert.ok(buyerData.token)
    buyerToken = buyerData.token

    // Transporter
    const resTrans = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'TRANSPORTER' })
    })
    const transData = await resTrans.json()
    assert.strictEqual(resTrans.status, 200)
    assert.ok(transData.token)
    transporterToken = transData.token

    // Admin
    const resAdmin = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN' })
    })
    const adminData = await resAdmin.json()
    assert.strictEqual(resAdmin.status, 200)
    assert.ok(adminData.token)
    adminToken = adminData.token
  })

  await t.test('2. Marketplace Product Search & Filtering (Protected Access & Public Preview)', async () => {
    // 2a. Unauthenticated product search must be rejected with 401
    const unauthRes = await fetch(`${BASE_URL}/products?search=onions`)
    assert.strictEqual(unauthRes.status, 401)
    const unauthData = await unauthRes.json()
    assert.strictEqual(unauthData.code, 'AUTH_REQUIRED')

    // 2b. Authenticated buyer search should succeed
    const res = await fetch(`${BASE_URL}/products?search=onions`, {
      headers: { 'Authorization': `Bearer ${buyerToken}` }
    })
    const data = await res.json()
    assert.strictEqual(res.status, 200)
    assert.ok(data.products.length >= 1)
    assert.ok(data.products[0].title.toLowerCase().includes('onion'))

    // 2c. Public preview without search filters allows guest access with sanitized fields
    const previewRes = await fetch(`${BASE_URL}/products?limit=6`)
    assert.strictEqual(previewRes.status, 200)
    const previewData = await previewRes.json()
    assert.ok(Array.isArray(previewData.products))
    assert.ok(previewData.products.length <= 6)
    if (previewData.products.length > 0) {
      assert.strictEqual(previewData.products[0].seller?.phone, undefined)
      assert.strictEqual(previewData.products[0].seller?.email, undefined)
    }

    // 2d. Protected product details requires authentication
    if (data.products[0]?.id) {
      const unauthDetail = await fetch(`${BASE_URL}/products/${data.products[0].id}`)
      assert.strictEqual(unauthDetail.status, 401)

      const authDetail = await fetch(`${BASE_URL}/products/${data.products[0].id}`, {
        headers: { 'Authorization': `Bearer ${buyerToken}` }
      })
      assert.strictEqual(authDetail.status, 200)
    }
  })

  await t.test('3. Farmer creates a new product listing', async () => {
    // Get category id
    const catRes = await fetch(`${BASE_URL}/categories`)
    const catData = await catRes.json()
    const vegCat = catData.categories.find(c => c.slug === 'vegetables') || catData.categories[0]

    const productPayload = {
      title: 'Bale Organic Highland Garlic (ነጭ ሽንኩርት)',
      categoryId: vegCat.id,
      description: 'Mountain-grown pungent white garlic from Bale highlands. High allicin content and excellent dry storage.',
      variety: 'Tsedey Garlic',
      grade: 'Grade 1 Export',
      unit: 'QUINTAL',
      pricePerUnit: 12500,
      minOrderQty: 1,
      availableQty: 40,
      region: 'Oromia',
      city: 'Robe / Bale',
      isOrganic: true,
      imageUrls: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80']
    }

    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${farmerToken}`
      },
      body: JSON.stringify(productPayload)
    })
    const data = await res.json()
    assert.strictEqual(res.status, 201)
    assert.ok(data.product.id)
    createdProductId = data.product.id
  })

  await t.test('4. Buyer requests quotation negotiation', async () => {
    const quotePayload = {
      productId: createdProductId,
      requestedQty: 10,
      requestedPrice: 11800,
      note: 'Can you supply 10 quintals of Bale garlic delivered to our Addis warehouse?'
    }

    const res = await fetch(`${BASE_URL}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify(quotePayload)
    })
    const data = await res.json()
    assert.strictEqual(res.status, 201)
    assert.ok(data.quote.id)
    quoteId = data.quote.id
  })

  await t.test('5. Farmer counters with counter-offer', async () => {
    const counterPayload = {
      proposedPrice: 12100,
      proposedQty: 10,
      note: 'Best price for Grade 1 cured garlic is 12,100 ETB per quintal.'
    }

    const res = await fetch(`${BASE_URL}/quotes/${quoteId}/counter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${farmerToken}`
      },
      body: JSON.stringify(counterPayload)
    })
    const data = await res.json()
    assert.strictEqual(res.status, 200)
    assert.strictEqual(data.quote.status, 'COUNTERED')
    assert.strictEqual(data.quote.offeredPrice, 12100)
  })

  await t.test('6. Buyer accepts quote terms -> Creates Confirmed Order & reserves stock', async () => {
    const res = await fetch(`${BASE_URL}/quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${buyerToken}`
      }
    })
    const data = await res.json()
    assert.strictEqual(res.status, 200)
    assert.strictEqual(data.quote.status, 'ACCEPTED')
    assert.ok(data.order.id)
    orderId = data.order.id
    assert.strictEqual(data.order.subtotal, 121000) // 10 * 12100
  })

  await t.test('7. Transporter views available delivery jobs and claims assignment', async () => {
    // Check available deliveries
    const resAvail = await fetch(`${BASE_URL}/deliveries/available`, {
      headers: { 'Authorization': `Bearer ${transporterToken}` }
    })
    const availData = await resAvail.json()
    assert.strictEqual(resAvail.status, 200)
    assert.ok(availData.deliveries.length >= 1)

    // Find delivery corresponding to our order
    const delivery = availData.deliveries.find(d => d.orderId === orderId) || availData.deliveries[0]
    assert.ok(delivery)

    // Claim delivery
    const resClaim = await fetch(`${BASE_URL}/deliveries/${delivery.id}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${transporterToken}`
      },
      body: JSON.stringify({})
    })
    const claimData = await resClaim.json()
    assert.strictEqual(resClaim.status, 200)
    assert.strictEqual(claimData.delivery.status, 'ASSIGNED')
    assert.ok(claimData.delivery.pickupVerificationCode)
    assert.ok(claimData.delivery.deliveryVerificationCode)

    // Test Pickup Verification (failure on wrong code, success on right code)
    const resWrongPickup = await fetch(`${BASE_URL}/deliveries/${delivery.id}/verify-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${transporterToken}`
      },
      body: JSON.stringify({ code: '000000' })
    })
    assert.strictEqual(resWrongPickup.status, 400)

    const resCorrectPickup = await fetch(`${BASE_URL}/deliveries/${delivery.id}/verify-pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${transporterToken}`
      },
      body: JSON.stringify({ code: claimData.delivery.pickupVerificationCode })
    })
    const pickupData = await resCorrectPickup.json()
    assert.strictEqual(resCorrectPickup.status, 200)
    assert.strictEqual(pickupData.delivery.status, 'PICKED_UP')
    assert.strictEqual(pickupData.delivery.isPickupVerified, true)

    // Transporter reports a transit delay
    const resDelay = await fetch(`${BASE_URL}/deliveries/${delivery.id}/report-delay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${transporterToken}`
      },
      body: JSON.stringify({ reason: 'Modjo checkpoint heavy weigh-scale traffic', location: 'Modjo Toll Plaza' })
    })
    const delayData = await resDelay.json()
    assert.strictEqual(resDelay.status, 200)
    assert.ok(delayData.delivery.reportedDelayReason.includes('Modjo'))

    // Customer delivery verification
    const resCorrectDelivery = await fetch(`${BASE_URL}/deliveries/${delivery.id}/verify-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${transporterToken}`
      },
      body: JSON.stringify({ code: claimData.delivery.deliveryVerificationCode })
    })
    const deliveryFinalData = await resCorrectDelivery.json()
    assert.strictEqual(resCorrectDelivery.status, 200)
    assert.strictEqual(deliveryFinalData.delivery.status, 'DELIVERED')
    assert.strictEqual(deliveryFinalData.delivery.isDeliveryVerified, true)
  })

  await t.test('8. Admin views platform stats and audit logs', async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })
    const data = await res.json()
    assert.strictEqual(res.status, 200)
    assert.ok(data.stats.usersCount >= 4)
    assert.ok(data.stats.ordersCount >= 1)
  })

  await t.test('9. RBAC Security: Buyer cannot access Admin endpoints', async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`, {