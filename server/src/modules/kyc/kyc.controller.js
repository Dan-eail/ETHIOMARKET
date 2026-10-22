import prisma from '../../config/database.js'
import { FaydaService } from './fayda.service.js'
import { ManualReviewService } from './manualReview.service.js'

export const getKycStatus = async (req, res, next) => {
  try {
    const userId = req.user.id

    const latestRecord = await prisma.verificationRecord.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    const allRecords = await prisma.verificationRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    res.json({
      isVerified: req.user.isVerified,
      userStatus: req.user.status,
      currentMethod: latestRecord?.method || null,
      currentStatus: latestRecord?.status || (req.user.isVerified ? 'VERIFIED' : 'NOT_STARTED'),
      latestRecord: latestRecord ? {
        id: latestRecord.id,
        method: latestRecord.method,
        status: latestRecord.status,
        providerRef: latestRecord.providerRef,
        documentType: latestRecord.documentType,
        documentNumber: latestRecord.documentNumber,
        hasDocumentFile: Boolean(latestRecord.documentFilePath),
        reviewerNotes: latestRecord.reviewerNotes,
        rejectionReason: latestRecord.rejectionReason,
        actionRequiredReason: latestRecord.actionRequiredReason,
        reviewedAt: latestRecord.reviewedAt,
        createdAt: latestRecord.createdAt
      } : null,
      history: allRecords.map(r => ({
        id: r.id,
        method: r.method,
        status: r.status,
        createdAt: r.createdAt
      })),
      faydaConfigured: FaydaService.isConfigured()
    })
  } catch (err) {
    next(err)
  }
}

export const initiateFaydaSession = async (req, res, next) => {
  try {
    const { consentGiven } = req.body
    const result = await FaydaService.initiateAuthSession({
      userId: req.user.id,
      consentGiven: Boolean(consentGiven)
    })
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const handleFaydaCallback = async (req, res, next) => {
  try {
    const { code, state, mockClaims } = req.body
    if (!state) {
      return res.status(400).json({ error: 'Missing OAuth2 state parameter.' })
    }

    const result = await FaydaService.handleCallback({
      code,
      state,
      requestingUserId: req.user.id,
      mockClaims
    })

    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const submitManualReview = async (req, res, next) => {
  try {
    const {
      documentType,
      documentNumber,
      userNotes,