import { Router } from 'express'
import mongoose from 'mongoose'
import Content from '../models/Content.js'
import ShowcaseEvent from '../models/ShowcaseEvent.js'
import WeeklyShowcase from '../models/WeeklyShowcase.js'
import User from '../models/User.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import { recordAudit } from '../services/audit.js'
import { getIsoWeekWindow, getPublicShowcase, getWeeklySnapshot } from '../services/showcase.js'
import { refreshFestivalListings } from '../services/festivalCrawler.js'

const router = Router()
const EVENT_TYPES = new Set(['festival', 'competition', 'grant', 'industry-event'])
const EVENT_STATUSES = new Set(['draft', 'published', 'archived'])
const STRING_LIMITS = { title: 160, summary: 320, description: 3000, posterUrl: 2048, region: 100, applicationUrl: 2048, eventUrl: 2048 }

function httpUrl(value, { required = false, field = 'URL' } = {}) {
  if ((value === '' || value === undefined || value === null) && !required) return ''
  if (typeof value !== 'string' || value.length > 2048) throw Object.assign(new Error(`${field} must be a valid HTTPS URL.`), { status: 400 })
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) throw new Error('invalid')
    return parsed.toString()
  } catch {
    throw Object.assign(new Error(`${field} must be a valid HTTPS URL.`), { status: 400 })
  }
}

function eventPayload(body, existing = {}) {
  const result = { ...existing }
  for (const [field, maxLength] of Object.entries(STRING_LIMITS)) {
    if (body[field] === undefined) continue
    if (typeof body[field] !== 'string' || body[field].trim().length > maxLength) {
      throw Object.assign(new Error(`${field} must be text with no more than ${maxLength} characters.`), { status: 400 })
    }
    result[field] = body[field].trim()
  }
  for (const field of ['posterUrl', 'applicationUrl', 'eventUrl']) {
    if (body[field] !== undefined) result[field] = httpUrl(body[field], { required: field === 'applicationUrl', field })
  }
  if (body.eventType !== undefined) {
    if (!EVENT_TYPES.has(body.eventType)) throw Object.assign(new Error('Unsupported film event type.'), { status: 400 })
    result.eventType = body.eventType
  }
  if (body.status !== undefined) {
    if (!EVENT_STATUSES.has(body.status)) throw Object.assign(new Error('Unsupported film event status.'), { status: 400 })
    result.status = body.status
  }
  for (const field of ['startAt', 'endAt', 'submissionDeadline']) {
    if (body[field] === undefined) continue
    if (body[field] === null || body[field] === '') {
      result[field] = null
      continue
    }
    const date = new Date(body[field])
    if (!Number.isFinite(date.getTime())) throw Object.assign(new Error(`${field} must be a valid date.`), { status: 400 })
    result[field] = date
  }
  if (!result.title) throw Object.assign(new Error('Event title is required.'), { status: 400 })
  if (!result.applicationUrl) throw Object.assign(new Error('An HTTPS applicationUrl is required.'), { status: 400 })
  if (!result.endAt && !result.submissionDeadline) {
    throw Object.assign(new Error('Set an endAt date or submissionDeadline so expired events leave the showcase.'), { status: 400 })
  }
  if (result.startAt && result.endAt && result.endAt < result.startAt) {
    throw Object.assign(new Error('endAt must be after startAt.'), { status: 400 })
  }
  return result
}

router.get('/short-films/candidates', requireAdmin, async (_req, res, next) => {
  try {
    const { startsAt, endsAt, weekKey } = getIsoWeekWindow()
    const items = await Content.aggregate([
      { $match: {
        type: 'film', category: { $regex: '^short[- ]film$', $options: 'i' },
        moderationStatus: 'published'
      } },
      { $addFields: {
        likeCount: { $size: { $ifNull: ['$likes', []] } },
        uploadedThisWeek: { $and: [
          { $gte: ['$createdAt', startsAt] },
          { $lt: ['$createdAt', endsAt] }
        ] }
      } },
      { $sort: { uploadedThisWeek: -1, likeCount: -1, createdAt: -1 } },
      { $limit: 100 },
      { $lookup: { from: User.collection.name, localField: 'creator', foreignField: '_id', as: 'creatorDetails' } },
      { $unwind: { path: '$creatorDetails', preserveNullAndEmptyArrays: true } },
      { $project: {
        _id: 1, title: 1, description: 1, posterUrl: 1, likeCount: 1, createdAt: 1, uploadedThisWeek: 1,
        showcaseApproved: { $ifNull: ['$showcaseApproved', false] },
        creator: { name: '$creatorDetails.name', username: '$creatorDetails.username' }
      } }
    ])
    res.json({ weekKey, items })
  } catch (error) { next(error) }
})

router.patch('/short-films/:contentId/approval', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.contentId)) return res.status(404).json({ message: 'Short film not found.' })
    if (typeof req.body?.approved !== 'boolean') return res.status(400).json({ message: 'approved must be true or false.' })
    const content = await Content.findOne({
      _id: req.params.contentId,
      type: 'film',
      category: { $regex: '^short[- ]film$', $options: 'i' },
      moderationStatus: 'published'
    })
    if (!content) return res.status(404).json({ message: 'Published short film not found.' })

    const previouslyApproved = Boolean(content.showcaseApproved)
    content.showcaseApproved = req.body.approved
    content.showcaseApprovedAt = req.body.approved ? new Date() : null
    content.showcaseApprovedBy = req.body.approved ? req.admin.username : null
    await content.save()
    await recordAudit(req.admin, {
      action: req.body.approved ? 'showcase_short_film_approved' : 'showcase_short_film_unapproved',
      targetType: 'content',
      targetId: content._id,
      targetLabel: content.title,
      previousStatus: previouslyApproved ? 'approved' : 'not_approved',
      newStatus: req.body.approved ? 'approved' : 'not_approved'
    })
    res.json({ contentId: content._id, showcaseApproved: content.showcaseApproved, showcaseApprovedAt: content.showcaseApprovedAt })
  } catch (error) { next(error) }
})

router.get('/events', requireAdmin, async (req, res, next) => {
  try {
    const filter = {}
    if (typeof req.query.status === 'string' && EVENT_STATUSES.has(req.query.status)) filter.status = req.query.status
    const items = await ShowcaseEvent.find(filter).sort({ status: 1, submissionDeadline: 1, startAt: 1, updatedAt: -1 }).limit(100).lean()
    res.json({ items })
  } catch (error) { next(error) }
})

router.post('/events', requireAdmin, async (req, res, next) => {
  try {
    const payload = eventPayload(req.body || {})
    const event = await ShowcaseEvent.create({ ...payload, status: payload.status || 'draft', createdBy: req.admin.username, updatedBy: req.admin.username })
    await recordAudit(req.admin, { action: 'showcase_event_created', targetType: 'showcase_event', targetId: event._id, targetLabel: event.title, newStatus: event.status })
    res.status(201).json(event)
  } catch (error) { next(error) }
})

router.patch('/events/:eventId', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.eventId)) return res.status(404).json({ message: 'Showcase event not found.' })
    const event = await ShowcaseEvent.findById(req.params.eventId)
    if (!event) return res.status(404).json({ message: 'Showcase event not found.' })
    const previousStatus = event.status
    const payload = eventPayload(req.body || {}, event.toObject())
    for (const [field, value] of Object.entries(payload)) {
      if (field !== '_id' && field !== 'createdBy' && field !== 'createdAt' && field !== 'updatedAt' && field !== '__v') event[field] = value
    }
    if (event.autoManaged) event.autoManaged = false
    event.updatedBy = req.admin.username
    await event.save()
    await recordAudit(req.admin, {
      action: 'showcase_event_updated', targetType: 'showcase_event', targetId: event._id,
      targetLabel: event.title, previousStatus, newStatus: event.status
    })
    res.json(event)
  } catch (error) { next(error) }
})

router.delete('/events/:eventId', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.eventId)) return res.status(404).json({ message: 'Showcase event not found.' })
    const event = await ShowcaseEvent.findById(req.params.eventId)
    if (!event) return res.status(404).json({ message: 'Showcase event not found.' })
    const previousStatus = event.status
    event.status = 'archived'
    event.autoManaged = false
    event.updatedBy = req.admin.username
    await event.save()
    await recordAudit(req.admin, {
      action: 'showcase_event_archived', targetType: 'showcase_event', targetId: event._id,
      targetLabel: event.title, previousStatus, newStatus: 'archived'
    })
    res.json({ message: 'Showcase event archived.', status: event.status })
  } catch (error) { next(error) }
})

router.post('/refresh', requireAdmin, async (req, res, next) => {
  try {
    if (!process.env.YOUTUBE_API_KEY) return res.status(503).json({ message: 'Set YOUTUBE_API_KEY on the server before refreshing YouTube trailers.' })
    const { weekKey } = getIsoWeekWindow()
    const current = await WeeklyShowcase.findOne({ weekKey }).select('generatedAt youtubeConfigured youtubeSearchCount manualRefreshAt').lean()
    const configuredAfterSnapshot = current && !current.youtubeConfigured
    const failedInitialRefresh = current && !current.youtubeSearchCount && !current.manualRefreshAt
    const manualRefreshCooldownMs = 24 * 60 * 60 * 1000
    if (current && !configuredAfterSnapshot && !failedInitialRefresh && Date.now() - new Date(current.generatedAt).getTime() < manualRefreshCooldownMs) {
      return res.status(429).json({ message: 'This week’s YouTube trailer set was already refreshed. Manual refresh is limited to once every 24 hours to protect API quota.' })
    }
    if (current) await WeeklyShowcase.updateOne({ _id: current._id }, { $set: { manualRefreshAt: new Date() } })
    const snapshot = await getWeeklySnapshot({ force: true })
    await recordAudit(req.admin, {
      action: 'weekly_showcase_refreshed', targetType: 'weekly_showcase', targetId: snapshot._id,
      targetLabel: snapshot.weekKey
    })
    res.json(await getPublicShowcase())
  } catch (error) { next(error) }
})

router.post('/events/refresh', requireAdmin, async (req, res, next) => {
  try {
    const { weekKey } = getIsoWeekWindow()
    const current = await WeeklyShowcase.findOne({ weekKey }).select('festivalScanAt').lean()
    const cooldownMs = 24 * 60 * 60 * 1000
    if (current?.festivalScanAt && Date.now() - new Date(current.festivalScanAt).getTime() < cooldownMs) {
      return res.status(429).json({ message: 'Festival websites were scanned recently. Automatic scans run once per week.' })
    }
    const report = await refreshFestivalListings()
    await recordAudit(req.admin, {
      action: 'festival_opportunities_scanned', targetType: 'weekly_showcase', targetLabel: weekKey,
      newStatus: `${report.publishedOrUpdated} opportunities published or updated`
    })
    res.json(report)
  } catch (error) { next(error) }
})

export default router
