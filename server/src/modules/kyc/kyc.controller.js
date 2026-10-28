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
      faydaConfigured: FaydaService.isConfigured(),
      faydaDiagnostic: FaydaService.getDiagnosticStatus()
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
    const { code, state, error, errorDescription } = req.body
    if (!state) {
      return res.status(400).json({ error: 'Missing OAuth2 state parameter.' })
    }

    const result = await FaydaService.handleCallback({
      code,
      state,
      error,
      errorDescription,
      requestingUserId: req.user.id
    })

    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const getFaydaDiagnostics = async (req, res, next) => {
  try {
    const diagnostic = FaydaService.getDiagnosticStatus()
    res.json(diagnostic)
  } catch (err) {
    next(err)
  }
}

export const submitManualReview = async (req, res, next) => {
  try {
    const {
      documentType,
      documentNumber,
      userNotes,
      consentGiven,
      documentBase64,
      documentFileName,
      documentMimeType
    } = req.body

    let documentFile = null
    if (documentBase64) {
      documentFile = {
        base64: documentBase64,
        originalname: documentFileName,
        mimetype: documentMimeType
      }
    }

    const record = await ManualReviewService.submitReview({
      userId: req.user.id,
      documentType,
      documentNumber,
      documentFile,
      userNotes,
      consentGiven: Boolean(consentGiven)
    })

    res.status(201).json({
      message: 'Manual review submitted successfully. EthioMarket compliance reviewers will evaluate your credentials.',
      record: {
        id: record.id,
        method: record.method,
        status: record.status,
        documentType: record.documentType,
        createdAt: record.createdAt
      }
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const getAdminReviewQueue = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const result = await ManualReviewService.getReviewQueue({
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const approveManualReview = async (req, res, next) => {
  try {
    const { id } = req.params
    const { decisionReason } = req.body

    const result = await ManualReviewService.approveReview({
      recordId: id,
      reviewerId: req.user.id,
      decisionReason
    })

    res.json({
      message: 'Manual review successfully approved. User identity is now marked as VERIFIED under method MANUAL_REVIEW.',
      record: result
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const rejectManualReview = async (req, res, next) => {
  try {
    const { id } = req.params
    const { decisionReason } = req.body

    const result = await ManualReviewService.rejectReview({
      recordId: id,
      reviewerId: req.user.id,
      decisionReason
    })

    res.json({
      message: 'Manual review rejected.',
      record: result
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const requestManualReviewInfo = async (req, res, next) => {
  try {
    const { id } = req.params
    const { actionRequiredReason } = req.body

    const result = await ManualReviewService.requestInfo({
      recordId: id,
      reviewerId: req.user.id,
      actionRequiredReason
    })

    res.json({
      message: 'Additional information requested from user.',
      record: result
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const streamDocumentFile = async (req, res, next) => {
  try {
    const { id } = req.params
    const fileInfo = await ManualReviewService.getDocumentStream({
      recordId: id,
      requestingUser: req.user,
      requestingUserRoles: req.userRoles
    })

    res.setHeader('Content-Type', fileInfo.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.fileName}"`)
    res.sendFile(fileInfo.filePath)
  } catch (err) {
    res.status(403).json({ error: err.message })
  }
}
