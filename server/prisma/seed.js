import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting EthioMarket Database Seeding...')

  // Clear existing data safely
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.deliveryEvent.deleteMany()
  await prisma.delivery.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.dispute.deleteMany()
  await prisma.review.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.quoteHistory.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.transporterProfile.deleteMany()
  await prisma.buyerProfile.deleteMany()
  await prisma.farmerProfile.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('Password123!', 10)

  // 1. Create Core Demo Users
  console.log('Creating demo users...')

  // Farmer: Abebe
  const farmerUser = await prisma.user.create({
    data: {
      email: 'farmer@ethiomarket.et',
      phone: '+251911223344',
      name: 'Abebe Bikila',
      passwordHash,
      status: 'ACTIVE',
      isVerified: true,