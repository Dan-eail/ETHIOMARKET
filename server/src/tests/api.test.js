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
