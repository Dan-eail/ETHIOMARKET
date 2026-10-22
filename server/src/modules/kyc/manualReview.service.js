import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { config } from '../../config/env.js'
import prisma from '../../config/database.js'

// Ensure private storage directory exists
const storageDir = path.resolve(config.fayda.kycStorageDir)
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true })
}

export class ManualReviewService {
  /**
   * Submit a manual review request with uploaded document or document details
   */
  static async submitReview({
    userId,
    documentType,
    documentNumber,
    documentFile, // { originalname, buffer, mimetype, size } or base64 payload
    userNotes,
    consentGiven
  }) {
    if (!consentGiven) {
      throw new Error('Explicit consent is required for manual identity document verification.')
    }

    if (!documentType) {
      throw new Error('Document type is required (e.g. KEBELE_ID, PASSPORT, DRIVING_LICENSE, TRADE_REGISTRATION, FARMER_ASSOCIATION_ID).')
    }

    // Check if user already has an active pending review
    const existingPending = await prisma.verificationRecord.findFirst({
      where: {
        userId,
        status: { in: ['PENDING_REVIEW', 'IN_PROGRESS'] }
      }
    })

    if (existingPending) {
      throw new Error('You already have a pending verification review in progress. Please wait for an administrator decision.')
    }

    let documentFilePath = null
    let documentFileName = null
    let documentFileSize = null
    let documentMimeType = null

    // If file uploaded (buffer or base64)
    if (documentFile) {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      const maxSizeBytes = 5 * 1024 * 1024 // 5MB

      const mime = documentFile.mimetype || 'image/jpeg'
      if (!allowedMimes.includes(mime)) {
        throw new Error('Invalid file format. Only JPEG, PNG, WEBP, and PDF documents are allowed.')
      }

      let buffer
      if (Buffer.isBuffer(documentFile.buffer)) {
        buffer = documentFile.buffer
      } else if (typeof documentFile.base64 === 'string') {
        const cleanBase64 = documentFile.base64.replace(/^data:[^;]+;base64,/, '')
        buffer = Buffer.from(cleanBase64, 'base64')
      }

      if (buffer) {
        if (buffer.length > maxSizeBytes) {
          throw new Error('Uploaded document exceeds maximum allowed size of 5MB.')
        }

        const safeExt = mime === 'application/pdf' ? '.pdf' : mime === 'image/png' ? '.png' : '.jpg'
        const randomFileName = `doc_${crypto.randomBytes(16).toString('hex')}${safeExt}`
        const absolutePath = path.join(storageDir, randomFileName)

        fs.writeFileSync(absolutePath, buffer)

        documentFilePath = absolutePath
        documentFileName = (documentFile.originalname || 'document' + safeExt).replace(/[^a-zA-Z0-9._-]/g, '_')
        documentFileSize = buffer.length
        documentMimeType = mime
      }
    }

    // Mask document number if provided
    const maskedDocNumber = documentNumber
      ? documentNumber.length > 4
        ? documentNumber.slice(0, 2) + '*'.repeat(documentNumber.length - 4) + documentNumber.slice(-2)
        : '****'
      : null

    const record = await prisma.verificationRecord.create({
      data: {
        userId,
        method: 'MANUAL_REVIEW',
        status: 'PENDING_REVIEW',
        documentType,
        documentNumber: maskedDocNumber,
        documentFilePath,
        documentFileName,
        documentFileSize,
        documentMimeType,
        userNotes: userNotes || 'Submitted for administrative manual review',
        consentGiven: true,
        consentTimestamp: new Date()
      }
    })

    // Log submission in platform audit log
    await prisma.auditLog.create({
      data: {
        userId,
        userRole: 'USER',
        action: 'MANUAL_KYC_SUBMITTED',
        entityType: 'VERIFICATION_RECORD',
        entityId: record.id,
        details: `Submitted manual review for docType: ${documentType}`
      }
    })

    return record
  }

  /**
   * Admin: List pending or all manual review records
   */
  static async getReviewQueue({ status, page = 1, limit = 20 }) {
    const where = {}
    if (status && status !== 'ALL') {
      where.status = status
    }

    const skip = (page - 1) * limit
    const [records, total] = await Promise.all([
      prisma.verificationRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              roles: true,
              farmerProfile: true,
              buyerProfile: true,
              transporterProfile: true,
              isVerified: true
            }
          },
          reviewer: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.verificationRecord.count({ where })
    ])

    return {
      records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Admin: Approve manual review
   */
  static async approveReview({ recordId, reviewerId, decisionReason }) {
    if (!decisionReason || decisionReason.trim().length < 5) {
      throw new Error('A mandatory decision rationale (minimum 5 characters) is required to approve manual verification.')
    }

    const record = await prisma.verificationRecord.findUnique({
      where: { id: recordId },
      include: { user: true }
    })

    if (!record) {
      throw new Error('Verification record not found.')
    }

    const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } })

    const [updatedRecord] = await prisma.$transaction([
      prisma.verificationRecord.update({
        where: { id: recordId },
        data: {
          status: 'VERIFIED',
          method: 'MANUAL_REVIEW', // Explicitly keep as MANUAL_REVIEW - never pretend it was Fayda
          reviewerId,
          reviewerNotes: decisionReason,
          reviewedAt: new Date()
        }
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { isVerified: true, status: 'ACTIVE' }
      }),
      prisma.farmerProfile.updateMany({
        where: { userId: record.userId },
        data: { verifiedBadge: true }
      }),
      prisma.transporterProfile.updateMany({
        where: { userId: record.userId },
        data: { verified: true }
      }),
      prisma.auditLog.create({
        data: {
          userId: reviewerId,
          userRole: 'ADMIN',
          action: 'MANUAL_KYC_APPROVED',
          entityType: 'VERIFICATION_RECORD',
          entityId: recordId,
          details: `Manual review approved by Admin ${reviewer?.name || reviewerId}. Rationale: "${decisionReason}". Method recorded: MANUAL_REVIEW.`
        }
      })
    ])

    return updatedRecord
  }

  /**
   * Admin: Reject manual review
   */
  static async rejectReview({ recordId, reviewerId, decisionReason }) {
    if (!decisionReason || decisionReason.trim().length < 5) {
      throw new Error('A mandatory rejection reason (minimum 5 characters) is required.')
    }

    const record = await prisma.verificationRecord.findUnique({
      where: { id: recordId },
      include: { user: true }
    })

    if (!record) {
      throw new Error('Verification record not found.')
    }

    const reviewer = await prisma.user.findUnique({ where: { id: reviewerId } })

    const [updatedRecord] = await prisma.$transaction([
      prisma.verificationRecord.update({
        where: { id: recordId },
        data: {
          status: 'REJECTED',
          rejectionReason: decisionReason,
          reviewerId,
          reviewerNotes: decisionReason,
          reviewedAt: new Date()
        }
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { isVerified: false }
      }),
      prisma.auditLog.create({
        data: {
          userId: reviewerId,
          userRole: 'ADMIN',
          action: 'MANUAL_KYC_REJECTED',
          entityType: 'VERIFICATION_RECORD',
          entityId: recordId,
          details: `Manual review rejected by Admin ${reviewer?.name || reviewerId}. Reason: "${decisionReason}".`
        }
      })
    ])

    return updatedRecord
  }

  /**
   * Admin: Request Additional Information
   */
  static async requestInfo({ recordId, reviewerId, actionRequiredReason }) {
    if (!actionRequiredReason || actionRequiredReason.trim().length < 5) {
      throw new Error('Specific instructions on what additional information is needed are required.')
    }

    const updatedRecord = await prisma.verificationRecord.update({
      where: { id: recordId },
      data: {
        status: 'ACTION_REQUIRED',
        actionRequiredReason,
        reviewerId,
        reviewedAt: new Date()
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: reviewerId,
        userRole: 'ADMIN',
        action: 'MANUAL_KYC_ACTION_REQUIRED',
        entityType: 'VERIFICATION_RECORD',
        entityId: recordId,
        details: `Additional information requested: ${actionRequiredReason}`
      }
    })

    return updatedRecord
  }

  /**
   * Secure document retrieval with role and ownership check
   */
  static async getDocumentStream({ recordId, requestingUser, requestingUserRoles }) {
    const record = await prisma.verificationRecord.findUnique({
      where: { id: recordId }
    })

    if (!record || !record.documentFilePath) {
      throw new Error('Document not found or no file attached.')
    }

    const isAdmin = requestingUserRoles && requestingUserRoles.includes('ADMIN')
    const isOwner = record.userId === requestingUser.id

    if (!isAdmin && !isOwner) {
      throw new Error('Unauthorized: You do not have permission to view this identity document.')
    }

    if (!fs.existsSync(record.documentFilePath)) {
      throw new Error('Document file no longer exists in secure storage.')
    }

    // Audit document access
    await prisma.auditLog.create({
      data: {
        userId: requestingUser.id,
        userRole: isAdmin ? 'ADMIN' : 'USER',
        action: 'KYC_DOCUMENT_ACCESSED',
        entityType: 'VERIFICATION_RECORD',
        entityId: recordId,
        details: `Document accessed by ${requestingUser.name} (${isAdmin ? 'ADMIN' : 'OWNER'})`
      }
    })

    return {
      filePath: record.documentFilePath,
      fileName: record.documentFileName,
      mimeType: record.documentMimeType || 'application/octet-stream'
    }
  }
}
