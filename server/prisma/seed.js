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
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      roles: {
        create: [
          { role: 'FARMER', isPrimary: true }
        ]
      },
      farmerProfile: {
        create: {
          farmName: 'Rift Valley Organic Agro',
          region: 'Oromia',
          zone: 'East Shewa',
          woreda: 'Meki / Ziway',
          kebele: '02 Kebele',
          farmSizeHectares: 14.5,
          experienceYears: 12,
          organicCertified: true,
          bio: 'Specializing in premium fresh red onions, export tomatoes, and crisp green peppers nurtured in the fertile soils of the Ethiopian Rift Valley.',
          verifiedBadge: true,
        }
      }
    }
  })

  // Second Farmer: Chaltu (Specialty Coffee & Teff)
  const farmerChaltu = await prisma.user.create({
    data: {
      email: 'chaltu@ethiomarket.et',
      phone: '+251911998877',
      name: 'Chaltu Gemechu',
      passwordHash,
      status: 'ACTIVE',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      roles: {
        create: [
          { role: 'FARMER', isPrimary: true }
        ]
      },
      farmerProfile: {
        create: {
          farmName: 'Keffa & Yirgacheffe Heritage Farms',
          region: 'Oromia',
          zone: 'Jimma / Guji',
          woreda: 'Gera',
          farmSizeHectares: 25.0,