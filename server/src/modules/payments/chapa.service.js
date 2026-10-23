import crypto from 'crypto'
import { config } from '../../config/env.js'
import prisma from '../../config/database.js'

export class ChapaService {
  /**
   * Check if Chapa is configured with API keys
   */
  static isConfigured() {
    return config.chapa.isConfigured()
  }

  /**
   * Initialize a Chapa checkout session for a specific Order
   */
  static async initializePayment({ orderId, buyerId, user, returnUrl, idempotencyKey }) {
    // 1. Fetch order and verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true, items: true }
    })

    if (!order) {
      throw new Error('Order not found.')
    }

    if (order.buyerId !== buyerId) {
      throw new Error('Access denied: You can only initiate payment for your own orders.')
    }

    if (order.isPaid || order.paymentStatus === 'PAID') {
      throw new Error('This order is already marked as paid.')
    }

    // 2. Check for existing idempotency key
    if (idempotencyKey) {
      const existingByIdempotency = await prisma.payment.findUnique({
        where: { idempotencyKey }
      })
      if (existingByIdempotency && existingByIdempotency.status === 'INITIATED') {
        return {
          paymentId: existingByIdempotency.id,
          merchantReference: existingByIdempotency.merchantReference,
          checkoutUrl: existingByIdempotency.checkoutUrl,
          amount: existingByIdempotency.amount,
          currency: existingByIdempotency.currency,
          status: existingByIdempotency.status,
          reused: true
        }
      }
    }

    // 3. Authoritative server-side amount calculation
    const payableAmount = Math.round(order.totalAmount * 100) / 100
    if (payableAmount <= 0) {
      throw new Error('Invalid payable amount for this order.')
    }

    // 4. Generate unique merchant payment reference
    const timestamp = Date.now().toString(36).toUpperCase()
    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase()
    const merchantReference = `ETMPAY-${order.orderNumber}-${timestamp}-${randSuffix}`

    const nameParts = (user.name || order.buyer.name || 'Buyer').trim().split(' ')
    const firstName = nameParts[0] || 'EthioMarket'
    const lastName = nameParts.slice(1).join(' ') || 'Customer'
    const finalReturnUrl = returnUrl || `${config.chapa.returnUrl}?tx_ref=${merchantReference}`

    let checkoutUrl = null
    let providerRef = null

    // 5. Call real Chapa V2 API if configured, otherwise provide test sandbox checkout URL
    if (this.isConfigured()) {
      try {
        const payload = {
          amount: payableAmount.toString(),
          currency: 'ETB',
          email: user.email || order.buyer.email,
          first_name: firstName,
          last_name: lastName,
          phone_number: user.phone || order.buyer.phone || '0911000000',
          tx_ref: merchantReference,
          callback_url: config.chapa.webhookUrl,
          return_url: finalReturnUrl,
          customization: {
            title: 'EthioMarket Agricultural Order',
            description: `Payment for Order #${order.orderNumber}`
          }
        }

        const chapaRes = await fetch(`${config.chapa.baseUrl}/transaction/initialize`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.chapa.secretKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        const chapaData = await chapaRes.json()

        if (!chapaRes.ok || chapaData.status !== 'success') {
          throw new Error(chapaData.message || 'Chapa payment initialization failed.')
        }

        checkoutUrl = chapaData.data?.checkout_url
        providerRef = chapaData.data?.reference || null
      } catch (err) {
        throw new Error(`Failed to initialize payment with Chapa: ${err.message}`)
      }
    } else {
      // Local development / simulated test checkout
      checkoutUrl = `${config.clientOrigin}/checkout/verify?tx_ref=${merchantReference}&mock=true`
    }

    // 6. Record payment in database
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        buyerId,
        merchantReference,
        providerReference: providerRef,
        amount: payableAmount,
        currency: 'ETB',
        status: 'INITIATED',
        checkoutUrl,
        idempotencyKey: idempotencyKey || null,
        metadata: JSON.stringify({
          orderNumber: order.orderNumber,
          buyerName: user.name,
          paymentEnvironment: config.chapa.environment
        })
      }
    })

    // Update order payment status to indicate payment is initiated
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PENDING',
        paymentMethod: 'CHAPA',
        paymentReference: merchantReference
      }
    })

    return {
      paymentId: payment.id,
      merchantReference: payment.merchantReference,
      checkoutUrl: payment.checkoutUrl,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status
    }
  }

  /**
   * Independently verify payment on the server side with Chapa API
   */
  static async verifyPayment({ tx_ref, requestingUserId, requestingUserRoles, mockProviderData = null }) {
    if (!tx_ref) {
      throw new Error('Merchant transaction reference (tx_ref) is required.')
    }

    const payment = await prisma.payment.findUnique({
      where: { merchantReference: tx_ref },
      include: {
        order: {
          include: { buyer: true, seller: true }
        },
        buyer: true
      }
    })

    if (!payment) {
      throw new Error(`No payment record found matching transaction reference "${tx_ref}".`)
    }

    // Check ownership if not admin
    const isAdmin = requestingUserRoles && requestingUserRoles.includes('ADMIN')
    if (requestingUserId && !isAdmin && payment.buyerId !== requestingUserId) {
      throw new Error('Access denied: You cannot verify a payment belonging to another buyer.')
    }

    // If already verified, return idempotent success
    if (payment.status === 'SUCCESS' && payment.order.isPaid) {
      return {
        verified: true,
        alreadyProcessed: true,
        payment,
        order: payment.order
      }
    }

    let providerData = null

    if (mockProviderData) {
      // Mock provider verification (for tests / sandbox testing)
      providerData = mockProviderData
    } else if (this.isConfigured()) {
      // Real server-to-server call to Chapa's official verify endpoint