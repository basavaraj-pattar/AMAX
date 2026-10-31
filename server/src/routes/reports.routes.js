import { Router } from 'express'
import mongoose from 'mongoose'
import Report from '../models/Report.js'
import { protect } from '../middleware/auth.js'

const router = Router()

const validCategories = [
  'nudity_sexual', 'vulgar_abusive', 'harassment_bullying', 'hate_speech_threats',
  'illegal_content', 'copyright_infringement', 'fraud_scam_impersonation', 'spam', 'other'
]

const validContentTypes = ['content', 'comment', 'equipment', 'user']

// POST /api/reports — submit a report
router.post('/', protect, async (req, res, next) => {
  try {
    const { contentType, contentId, category, explanation = '' } = req.body || {}

    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({ message: 'Invalid content type.' })
    }
    if (!mongoose.isValidObjectId(contentId)) {
      return res.status(400).json({ message: 'Invalid content ID.' })
    }
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid report category.' })
    }
    if (typeof explanation !== 'string' || explanation.length > 2000) {
      return res.status(400).json({ message: 'Explanation must be under 2000 characters.' })
    }

    // Prevent duplicate reports from the same user on the same item
    const existing = await Report.findOne({
      reporter: req.user._id,
      contentType,
      contentId: new mongoose.Types.ObjectId(contentId)
    })
    if (existing) {
      return res.status(409).json({ message: 'You have already reported this item.' })
    }

    await Report.create({
      reporter: req.user._id,
      contentType,
      contentId: new mongoose.Types.ObjectId(contentId),
      category,
      explanation: explanation.trim()
    })

    res.status(201).json({ message: 'Your report has been submitted. Thank you for helping keep A-MAX safe.' })
  } catch (error) { next(error) }
})

export default router
