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
          experienceYears: 18,
          organicCertified: true,
          bio: 'Producer of high-altitude Ethiopian Arabica coffee beans and Magna white teff from Bishoftu highlands.',
          verifiedBadge: true,
        }
      }
    }
  })

  // Buyer: Almaz (Wholesaler & Commercial Distributor)
  const buyerUser = await prisma.user.create({
    data: {
      email: 'buyer@ethiomarket.et',
      phone: '+251922334455',
      name: 'Almaz Kebede',
      passwordHash,
      status: 'ACTIVE',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      roles: {
        create: [
          { role: 'BUYER', isPrimary: true }
        ]
      },
      buyerProfile: {
        create: {
          businessName: 'Addis Fresh Produce Supply Co.',
          businessType: 'WHOLESALER',
          tinNumber: '004829104',
          region: 'Addis Ababa',
          city: 'Bole Subcity',
          deliveryAddress: 'Bole Medhanialem, Commercial Logistics Hub Warehouse #4',
        }
      }
    }
  })

  // Transporter: Kebede (Logistics Provider)
  const transporterUser = await prisma.user.create({
    data: {
      email: 'transporter@ethiomarket.et',
      phone: '+251933445566',
      name: 'Kebede Tessema',
      passwordHash,
      status: 'ACTIVE',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      roles: {
        create: [
          { role: 'TRANSPORTER', isPrimary: true }
        ]
      },
      transporterProfile: {
        create: {
          companyName: 'Abyssinia Fast Cargo & Haulage',
          licenseNumber: 'ETH-TRANS-2024-914',
          regionsCovered: 'Oromia, Addis Ababa, Sidama, Amhara',
          verified: true,
          rating: 4.9,
          vehicles: {
            create: [
              {
                plateNumber: '3-A48291-AA',
                vehicleType: 'ISUZU',
                capacityTons: 8.5,
                modelYear: 2022,
                active: true,
                verified: true
              },
              {
                plateNumber: '3-B19283-AA',
                vehicleType: 'PICKUP',
                capacityTons: 2.0,
                modelYear: 2023,
                active: true,
                verified: true
              }
            ]
          }
        }
      }
    }
  })

  // Admin: Dan
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ethiomarket.et',
      phone: '+251944556677',
      name: 'Dan Eail (Admin)',
      passwordHash,
      status: 'ACTIVE',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      roles: {
        create: [
          { role: 'ADMIN', isPrimary: true }
        ]
      }
    }
  })

  // 2. Create Produce Categories
  console.log('Creating categories...')
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Vegetables',
        slug: 'vegetables',
        description: 'Fresh farm-harvested onions, tomatoes, peppers, cabbages, and potatoes.',
        icon: 'Carrot',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Grains & Cereals',
        slug: 'grains-cereals',
        description: 'Authentic Ethiopian Magna White Teff, durum wheat, barley, and highland maize.',
        icon: 'Wheat',
        imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Coffee & Cash Crops',
        slug: 'coffee-cash-crops',
        description: 'World-renowned Ethiopian specialty Arabica coffee beans: Yirgacheffe, Sidama, and Harar.',
        icon: 'Coffee',
        imageUrl: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop&q=80',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Fruits',
        slug: 'fruits',
        description: 'Naturally ripened Ethiopian avocados, mangoes, papayas, and sweet bananas.',
        icon: 'Apple',
        imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Pulses & Oilseeds',
        slug: 'pulses-oilseeds',
        description: 'High-protein chickpeas, red lentils, white sesame seeds, and faba beans.',
        icon: 'Sprout',
        imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Spices & Honey',
        slug: 'spices-honey',
        description: 'Authentic Ethiopian red Berbere chili, highland ginger, and Tigray white honey.',
        icon: 'Flame',
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
      }
    }),
  ])

  const [vegCat, grainCat, coffeeCat, fruitCat, pulseCat, spiceCat] = categories

  // 3. Create Products with Realistic Ethiopian Pricing & Regions
  console.log('Creating realistic agricultural listings...')

  const p1 = await prisma.product.create({
    data: {
      sellerId: farmerUser.id,
      categoryId: vegCat.id,
      title: 'Meki Fresh Red Onions (ቀይ ሽንኩርት)',
      slug: 'meki-fresh-red-onions',
      description: 'Grade-A pungency red onions harvested from Meki Rift Valley. Well-cured, firm bulbs with exceptional shelf life suitable for wholesale markets and institutional kitchens.',
      variety: 'Bombay Red',
      grade: 'Grade 1 Wholesale',
      harvestDate: new Date('2026-10-15'),
      unit: 'QUINTAL',
      pricePerUnit: 3400.0, // 34 ETB/kg -> 3400 ETB/Quintal
      currency: 'ETB',
      minOrderQty: 5,
      availableQty: 180,
      reservedQty: 20,
      region: 'Oromia',
      city: 'Meki',
      specificLocation: 'Ziway Road Farm Hub #2',
      status: 'PUBLISHED',
      isOrganic: true,
      featured: true,
      viewsCount: 342,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80',
            altText: 'Fresh harvest red onions in crates',
            isPrimary: true,
            sortOrder: 0
          },
          {
            url: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=800&auto=format&fit=crop&q=80',
            altText: 'Dry cured red onions',
            isPrimary: false,
            sortOrder: 1
          }
        ]
      }
    }
  })

  const p2 = await prisma.product.create({
    data: {
      sellerId: farmerUser.id,
      categoryId: vegCat.id,
      title: 'Shashemene Field Tomatoes (ቲማቲም)',
      slug: 'shashemene-field-tomatoes',
      description: 'Plump, sun-ripened Roma tomatoes grown with clean borehole irrigation. Ideal for commercial puree, paste, supermarkets, and hotel supply chains.',
      variety: 'Roma VF',
      grade: 'Class 1 Fresh',
      harvestDate: new Date('2026-10-22'),
      unit: 'CRATE',
      pricePerUnit: 850.0, // Per 25kg wooden crate
      currency: 'ETB',
      minOrderQty: 10,
      availableQty: 250,
      reservedQty: 15,
      region: 'Oromia',
      city: 'Shashemene',
      specificLocation: 'Melka Oda Outskirts',
      status: 'PUBLISHED',
      isOrganic: false,
      featured: true,
      viewsCount: 512,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
            altText: 'Vibrant fresh red tomatoes',
            isPrimary: true,
            sortOrder: 0
          }
        ]
      }
    }
  })

  const p3 = await prisma.product.create({
    data: {
      sellerId: farmerChaltu.id,
      categoryId: grainCat.id,
      title: 'Ada’a Magna White Teff (ነጭ ጤፍ)',
      slug: 'adaa-magna-white-teff',
      description: 'The gold standard of Ethiopian teff from the famed volcanic plains of Ada’a (Bishoftu). 100% stone-free, triple-sifted, ultra-fine white grain that bakes spongy, fragrant injera.',
      variety: 'Quncho / Magna',
      grade: 'Export Grade 1',
      harvestDate: new Date('2026-09-28'),
      unit: 'QUINTAL',
      pricePerUnit: 9800.0, // 9,800 ETB per quintal
      currency: 'ETB',
      minOrderQty: 2,
      availableQty: 95,
      reservedQty: 5,
      region: 'Oromia',
      city: 'Bishoftu',
      specificLocation: 'Ada’a Cooperative Silo #3',
      status: 'PUBLISHED',
      isOrganic: true,
      featured: true,
      viewsCount: 890,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80',
            altText: 'Clean organic Ethiopian grain bags',
            isPrimary: true,
            sortOrder: 0
          }
        ]
      }
    }
  })

  const p4 = await prisma.product.create({
    data: {
      sellerId: farmerChaltu.id,
      categoryId: coffeeCat.id,
      title: 'Yirgacheffe Washed Grade 1 Specialty Coffee (ቡና)',
      slug: 'yirgacheffe-specialty-coffee',
      description: 'Single-origin highland Arabica with jasmine floral aroma, lemon zest acidity, and delicate bergamot notes. Hand-picked at 2,000m elevation and fully washed.',
      variety: 'Heirloom Arabica',
      grade: 'Q-Score 88+ Grade 1',
      harvestDate: new Date('2026-08-15'),
      unit: 'SACK', // 60kg jute bag
      pricePerUnit: 24500.0,
      currency: 'ETB',
      minOrderQty: 1,
      availableQty: 40,
      reservedQty: 0,
      region: 'SNNPR / Sidama',
      city: 'Yirgacheffe',
      specificLocation: 'Konga Washing Station',
      status: 'PUBLISHED',
      isOrganic: true,
      featured: true,
      viewsCount: 1205,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&auto=format&fit=crop&q=80',
            altText: 'Raw green coffee beans and roasted coffee',
            isPrimary: true,
            sortOrder: 0
          }
        ]
      }
    }
  })

  const p5 = await prisma.product.create({
    data: {
      sellerId: farmerUser.id,
      categoryId: fruitCat.id,
      title: 'Hawassa Haas Organic Avocados (አቮካዶ)',
      slug: 'hawassa-haas-organic-avocados',
      description: 'Export-standard creamy Haas avocados from lake Hawassa basin. High oil content, perfectly shaped, harvested mature-green with 10-day transport shelf-life.',
      variety: 'Haas',
      grade: 'Grade A Export',
      harvestDate: new Date('2026-10-24'),
      unit: 'CRATE', // 20kg box
      pricePerUnit: 1200.0,
      currency: 'ETB',
      minOrderQty: 5,
      availableQty: 140,
      reservedQty: 10,
      region: 'Sidama',
      city: 'Hawassa',
      specificLocation: 'Tikur Wuha Orchard Site',
      status: 'PUBLISHED',
      isOrganic: true,
      featured: false,
      viewsCount: 430,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop&q=80',
            altText: 'Fresh ripe green avocados',
            isPrimary: true,
            sortOrder: 0
          }
        ]
      }
    }
  })

  const p6 = await prisma.product.create({
    data: {
      sellerId: farmerUser.id,
      categoryId: vegCat.id,
      title: 'Ambo Crisp Green Peppers (ቃሪያ / ሚጥሚጣ)',
      slug: 'ambo-crisp-green-peppers',
      description: 'Vibrant emerald green peppers, crisp texture with medium heat. Picked fresh daily for Addis Ababa restaurants and vegetable markets.',
      variety: 'Mareko Fana',
      grade: 'Class 1',
      harvestDate: new Date('2026-10-25'),
      unit: 'SACK',
      pricePerUnit: 1650.0,
      currency: 'ETB',
      minOrderQty: 3,
      availableQty: 75,
      reservedQty: 0,
      region: 'Oromia',
      city: 'Ambo',
      specificLocation: 'Guder River Bank Farms',
      status: 'PUBLISHED',
      isOrganic: false,
      featured: false,
      viewsCount: 210,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&auto=format&fit=crop&q=80',
            altText: 'Fresh crisp green peppers',
            isPrimary: true,
            sortOrder: 0
          }
        ]
      }
    }
  })

  // 4. Create Active Negotiation Quote
  console.log('Creating sample quote & negotiation...')
  const sampleQuote = await prisma.quote.create({
    data: {
      quoteNumber: 'Q-2026-0881',
      buyerId: buyerUser.id,
      sellerId: farmerUser.id,
      productId: p1.id,
      requestedQty: 50,
      requestedPrice: 3100.0, // Buyer offered 3100
      offeredPrice: 3250.0,   // Farmer countered at 3250
      unit: 'QUINTAL',
      currency: 'ETB',
      status: 'COUNTERED',
      note: 'Looking to purchase 50 quintals for our Bole retail store. Can you do 3,100 ETB/quintal if we pay cash on delivery?',
      counterpartyNote: 'We can meet you at 3,250 ETB/quintal for 50 quintals with immediate dispatch from Meki warehouse.',
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      history: {
        create: [
          {
            senderId: buyerUser.id,
            senderRole: 'BUYER',
            proposedPrice: 3100.0,
            proposedQty: 50,
            note: 'Initial offer of 3,100 ETB per quintal for bulk 50 quintals'
          },
          {
            senderId: farmerUser.id,
            senderRole: 'SELLER',
            proposedPrice: 3250.0,
            proposedQty: 50,
            note: 'Counter-offer: 3,250 ETB per quintal with high grade grading'
          }
        ]
      }
    }
  })

  // 5. Create Sample Confirmed Order & Delivery Assignment
  console.log('Creating sample orders and deliveries...')
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-1042',
      invoiceNumber: 'INV-2026-1042',
      buyerId: buyerUser.id,
      sellerId: farmerUser.id,
      subtotal: 68000.0, // 20 quintals * 3400 ETB
      deliveryFee: 4500.0,
      totalAmount: 72500.0,
      currency: 'ETB',
      status: 'IN_TRANSIT',
      paymentStatus: 'CASH_ON_DELIVERY',
      paymentMethod: 'CASH_ON_DELIVERY',
      deliveryAddressSnapshot: 'Addis Fresh Produce Co., Bole Subcity, Medhanialem Logistics Hub #4, Addis Ababa',
      notes: 'Please verify truck seal upon arrival at Addis warehouse.',
      items: {
        create: [
          {
            productId: p1.id,
            productName: p1.title,
            productUnit: p1.unit,
            quantity: 20,
            unitPrice: 3400.0,
            totalPrice: 68000.0,
          }
        ]
      }
    }
  })

  const transporterProfile = await prisma.transporterProfile.findUnique({
    where: { userId: transporterUser.id },
    include: { vehicles: true }
  })

  const vehicle = transporterProfile?.vehicles[0]

  const sampleDelivery = await prisma.delivery.create({
    data: {
      deliveryNumber: 'DEL-2026-9014',
      orderId: sampleOrder.id,
      transporterId: transporterProfile?.id,
      vehicleId: vehicle?.id,
      pickupRegion: 'Oromia',
      pickupCity: 'Meki',
      pickupAddress: 'Rift Valley Organic Agro Warehouse #2, Meki Main Road',
      dropoffRegion: 'Addis Ababa',
      dropoffCity: 'Bole',
      dropoffAddress: 'Bole Medhanialem Logistics Hub #4',
      cargoWeightQuintals: 20,
      distanceKm: 135,
      deliveryFee: 4500.0,
      status: 'IN_TRANSIT',
      pickupVerificationCode: '492810',
      deliveryVerificationCode: '817294',
      isPickupVerified: true,
      cargoSealNumber: 'SEAL-ETH-8912',
      recipientName: 'Almaz Kebede (Procurement Manager)',
      recipientPhone: '+251922334455',
      events: {
        create: [
          {
            status: 'ASSIGNED',
            description: 'Transporter accepted delivery assignment. Truck dispatched.',
            location: 'Meki Logistics Yard',
            timestamp: new Date(Date.now() - 4 * 3600 * 1000)
          },
          {
            status: 'PICKED_UP',
            description: 'Loaded 20 quintals of Meki Red Onions. Weight inspected and cargo secured.',
            location: 'Rift Valley Agro Farm Depot',
            timestamp: new Date(Date.now() - 2 * 3600 * 1000)
          },
          {
            status: 'IN_TRANSIT',
            description: 'Vehicle en route via Expressway passing Mojo Toll gate.',
            location: 'Mojo Expressway Junction',
            timestamp: new Date(Date.now() - 30 * 60 * 1000)
          }
        ]
      }
    }
  })

  // 6. Create Available Delivery Request for Transporters
  const openOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2026-1049',
      buyerId: buyerUser.id,
      sellerId: farmerChaltu.id,
      subtotal: 98000.0, // 10 quintals teff * 9800
      deliveryFee: 3200.0,
      totalAmount: 101200.0,
      currency: 'ETB',
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      paymentMethod: 'TELEBIRR',
      deliveryAddressSnapshot: 'Addis Fresh Distributors, Merkato Main Grain Terminal #12, Addis Ababa',
      notes: 'Grain sacks must be kept dry with heavy tarpaulin covers.',
      items: {
        create: [
          {
            productId: p3.id,
            productName: p3.title,
            productUnit: p3.unit,
            quantity: 10,
            unitPrice: 9800.0,
            totalPrice: 98000.0
          }
        ]
      }
    }
  })

  await prisma.delivery.create({
    data: {
      deliveryNumber: 'DEL-2026-9021',
      orderId: openOrder.id,
      transporterId: null, // Open for claiming!
      pickupRegion: 'Oromia',
      pickupCity: 'Bishoftu',
      pickupAddress: 'Ada’a Farmers Union Silo #3, Bishoftu',
      dropoffRegion: 'Addis Ababa',
      dropoffCity: 'Merkato',
      dropoffAddress: 'Merkato Main Grain Terminal #12',
      cargoWeightQuintals: 10,
      distanceKm: 48,
      deliveryFee: 3200.0,
      status: 'REQUESTED',
      recipientName: 'Merkato Depot Receiving Manager',
      recipientPhone: '+251911448833',
    }
  })

  // 7. Create Demo Conversation and Messages
  const conversation = await prisma.conversation.create({
    data: {
      participant1Id: buyerUser.id,
      participant2Id: farmerUser.id,
      topic: 'Negotiation for Meki Red Onions',
      messages: {
        create: [
          {
            senderId: buyerUser.id,
            text: 'Hello Ato Abebe! We saw your 180 quintals of Meki Red Onions. Are they dry cured and ready for immediate loading?',
            createdAt: new Date(Date.now() - 3600 * 1000 * 3)
          },
          {
            senderId: farmerUser.id,
            text: 'Selam W/ro Almaz! Yes, they were harvested 10 days ago and properly sun-cured. Quality is top Grade-A with zero spoilage.',
            createdAt: new Date(Date.now() - 3600 * 1000 * 2)
          },
          {
            senderId: buyerUser.id,
            text: 'Excellent. I have placed an official counter-offer for 50 quintals at 3,250 ETB. Let us proceed with order confirmation.',
            createdAt: new Date(Date.now() - 3600 * 1000 * 1)
          }
        ]
      }
    }
  })

  // 8. Notifications for each role
  await prisma.notification.createMany({
    data: [
      {
        userId: farmerUser.id,
        title: 'New Negotiation Offer Received',
        message: 'Almaz Kebede sent a counter-offer of 3,250 ETB/Quintal for Meki Red Onions.',
        type: 'QUOTE',
        linkUrl: '/dashboard/farmer/quotes'
      },
      {
        userId: buyerUser.id,
        title: 'Cargo Dispatched - En Route',
        message: 'Your order #ORD-2026-1042 was picked up by Kebede Tessema and is in transit.',
        type: 'DELIVERY',
        linkUrl: '/dashboard/buyer/orders'
      },
      {
        userId: transporterUser.id,
        title: 'New Delivery Job Available in Bishoftu',
        message: '10 quintals of Ada’a White Teff ready for transport from Bishoftu to Merkato (3,200 ETB fee).',
        type: 'DELIVERY',
        linkUrl: '/dashboard/transporter/available'
      },
      {
        userId: adminUser.id,
        title: 'New Farmer KYC Verification Request',
        message: 'Chaltu Gemechu submitted farm registration certificate for verification.',
        type: 'SYSTEM',
        linkUrl: '/dashboard/admin/users'
      }
    ]
  })

  // 9. Admin Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        userRole: 'ADMIN',
        action: 'USER_VERIFIED',
        entityType: 'USER',
        entityId: farmerUser.id,
        details: 'Verified Abebe Bikila with Oromia Agricultural Bureau farmer license ID #ET-AGR-491',
      },
      {
        userId: adminUser.id,
        userRole: 'ADMIN',
        action: 'PRODUCT_APPROVED',
        entityType: 'PRODUCT',
        entityId: p1.id,
        details: 'Listing approved for public marketplace display after standard review.',
      }
    ]
  })

  // 10. Official Ethiopian Market Price Intelligence Observations (ECX & Ministry of Agriculture)
  console.log('Seeding market price intelligence...')
  await prisma.marketPriceObservation.createMany({
    data: [
      {
        cropName: 'Ada’a Magna White Teff (ነጭ ጤፍ)',
        categorySlug: 'grains-cereals',
        marketName: 'Ada’a Cooperative Union Silos',
        region: 'Oromia (Bishoftu)',
        pricePerUnit: 9800.0,
        unit: 'QUINTAL',
        trendPercentage: 2.8,
        source: 'Ethiopia Commodity Exchange (ECX) & Ada’a Union',
      },
      {
        cropName: 'Meki Red Onions (ቀይ ሽንኩርት)',
        categorySlug: 'vegetables',
        marketName: 'Meki Farm Gate Terminal',
        region: 'Oromia (East Shewa)',
        pricePerUnit: 3400.0,
        unit: 'QUINTAL',
        trendPercentage: -1.5,
        source: 'Rift Valley Farmers Union Market Bulletin',
      },
      {
        cropName: 'Shashemene Roma Tomatoes (ቲማቲም)',
        categorySlug: 'vegetables',
        marketName: 'Melka Oda Wholesale Market',
        region: 'Oromia (West Arsi)',
        pricePerUnit: 850.0,
        unit: 'CRATE',
        trendPercentage: 4.1,
        source: 'Ministry of Agriculture Regional Bureau',
      },
      {
        cropName: 'Yirgacheffe Grade 1 Washed Coffee (ቡና)',
        categorySlug: 'coffee-cash-crops',
        marketName: 'ECX Hawassa Delivery Center',
        region: 'Sidama / Gedeo',
        pricePerUnit: 24500.0,
        unit: 'SACK',
        trendPercentage: 5.2,
        source: 'Ethiopian Coffee & Tea Authority (ECTA)',
      },
      {
        cropName: 'Hawassa Export Haas Avocados (አቮካዶ)',
        categorySlug: 'fruits',
        marketName: 'Tikur Wuha Agro-Industrial Park',
        region: 'Sidama',
        pricePerUnit: 1200.0,
        unit: 'CRATE',
        trendPercentage: 0.0,
        source: 'Sidama Horticulture Export Association',
      },
      {
        cropName: 'Bale Highland Garlic (ነጭ ሽንኩርት)',
        categorySlug: 'vegetables',
        marketName: 'Robe Central Wholesale Depot',
        region: 'Oromia (Bale)',
        pricePerUnit: 12500.0,
        unit: 'QUINTAL',
        trendPercentage: 3.0,
        source: 'Bale Agricultural Cooperative Federation',
      }
    ]
  })

  // 11. Sample Favorite for Buyer
  await prisma.favorite.create({
    data: {
      userId: buyerUser.id,
      productId: p1.id,
    }
  })

  console.log('✅ EthioMarket Database Seeding Completed Successfully!')

}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
