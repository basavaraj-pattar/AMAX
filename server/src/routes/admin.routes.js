import { Router } from 'express'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import AdminAccount from '../models/AdminAccount.js'
import User from '../models/User.js'
import Community from '../models/Community.js'
import CommunityMembershipRequest from '../models/CommunityMembershipRequest.js'
import Content from '../models/Content.js'
import Comment from '../models/Comment.js'
import EquipmentListing from '../models/EquipmentListing.js'
import Report from '../models/Report.js'
import AuditLog from '../models/AuditLog.js'
import { requireAdmin, signAdminToken } from '../middleware/adminAuth.js'
import { recordAudit } from '../services/audit.js'
import { resolveCommunityJoinNotifications } from '../services/notifications.js'

const router = Router()

// ─── Rate-limit state (in-memory, per-process) ───────────────────────────────
const loginAttempts = new Map() // key: username, value: { count, resetAt }
const MAX_LOGIN_ATTEMPTS = 10
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000  // 15 minutes
const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

function checkRateLimit(username) {
  const now = Date.now()
  const entry = loginAttempts.get(username)
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(username, { count: 1, resetAt: now + LOCKOUT_WINDOW_MS, lockedUntil: null })
    return { allowed: true }
  }
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000)
    return { allowed: false, remainingSeconds }
  }
  entry.count++
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS
    return { allowed: false, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) }
  }
  return { allowed: true }
}

function clearRateLimit(username) {
  loginAttempts.delete(username)
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ─── POST /api/admin/auth/login ───────────────────────────────────────────────
router.post('/auth/login', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Admin system temporarily unavailable.' })
    }
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' })
    }

    const normalizedUsername = username.toLocaleLowerCase('en-US')
    const rateLimitResult = checkRateLimit(normalizedUsername)
    if (!rateLimitResult.allowed) {
      return res.status(429).json({ message: `Too many failed attempts. Try again in ${Math.ceil(rateLimitResult.remainingSeconds / 60)} minutes.` })
    }

    // AdminAccount usernames retain their configured casing. Match case-insensitively
    // so `mg admin` and `MG Admin` reach the same account without loosening auth.
    const admin = await AdminAccount.findOne({ username: new RegExp(`^${escapeRegex(username)}$`, 'i') })
      .select('+passwordHash +failedLoginAttempts +lockedUntil')
    const passwordMatches = admin ? await bcrypt.compare(password, admin.passwordHash) : false

    if (!admin || !passwordMatches || !admin.active) {
      // Generic message regardless of whether user or password is wrong
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    clearRateLimit(normalizedUsername)
    admin.failedLoginAttempts = 0
    admin.lockedUntil = null
    admin.lastLoginAt = new Date()
    await admin.save()

    const token = signAdminToken(admin)
    return res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        displayName: admin.displayName,
        mustChangePassword: admin.mustChangePassword
      }
    })
  } catch (error) { next(error) }
})

// ─── POST /api/admin/auth/change-password ────────────────────────────────────
router.post('/auth/change-password', requireAdmin, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Both current and new passwords are required.' })
    }
    if (newPassword.length < 10 || newPassword.length > 128) {
      return res.status(400).json({ message: 'New password must be 10 to 128 characters.' })
    }

    const admin = await AdminAccount.findById(req.admin._id).select('+passwordHash')
    if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      return res.status(401).json({ message: 'Current password is incorrect.' })
    }
    admin.passwordHash = await bcrypt.hash(newPassword, 12)
    admin.mustChangePassword = false
    await admin.save()

    await recordAudit(admin, {
      action: 'admin_password_changed',
      targetType: 'admin',
      targetId: admin._id,
      targetLabel: admin.username
    })

    const newToken = signAdminToken(admin)
    res.json({ message: 'Password changed successfully.', token: newToken })
  } catch (error) { next(error) }
})

// ─── GET /api/admin/auth/me ───────────────────────────────────────────────────
router.get('/auth/me', requireAdmin, (req, res) => {
  const a = req.admin
  res.json({ id: a._id, username: a.username, displayName: a.displayName, mustChangePassword: a.mustChangePassword, lastLoginAt: a.lastLoginAt })
})

router.get('/community-requests', requireAdmin, async (req, res, next) => {
  try {
    const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending'
    const requests = await CommunityMembershipRequest.find({ status })
      .populate('community', 'name slug')
      .populate('user', 'name username avatarUrl')
      .sort({ requestedAt: 1 })
      .limit(200)
      .lean()
    res.json(requests.filter(item => item.community && item.user).map(item => ({
      id: String(item._id),
      status: item.status,
      message: item.message || '',
      requestedAt: item.requestedAt,
      reviewedAt: item.reviewedAt,
      community: { id: String(item.community._id), name: item.community.name, slug: item.community.slug },
      user: { id: String(item.user._id), name: item.user.name, username: item.user.username, avatarUrl: item.user.avatarUrl || '' }
    })))
  } catch (error) { next(error) }
})

router.patch('/community-requests/:requestId', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.requestId)) return res.status(404).json({ message: 'Membership request not found.' })
    const decision = req.body.decision
    if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ message: 'Choose approve or reject.' })
    const status = decision === 'approve' ? 'approved' : 'rejected'
    const request = await CommunityMembershipRequest.findOneAndUpdate(
      { _id: req.params.requestId, status: 'pending' },
      { $set: { status, reviewedAt: new Date(), reviewedByUser: null, reviewedByAdmin: req.admin._id } },
      { new: true }
    ).populate('community', 'name slug')
    if (!request) return res.status(409).json({ message: 'This request has already been reviewed.' })

    if (decision === 'approve') await Community.updateOne({ _id: request.community._id }, { $addToSet: { members: request.user }, $set: { lastActivityAt: new Date() } })
    await resolveCommunityJoinNotifications(req, request._id)
    await recordAudit(req.admin, {
      action: decision === 'approve' ? 'community_membership_request_approved' : 'community_membership_request_rejected',
      targetType: 'community_membership_request',
      targetId: request._id,
      targetLabel: `${request.community?.name || 'Community'} · ${request.user}`,
      previousStatus: 'pending',
      newStatus: status
    })
    req.app.get('io')?.to(`user:${request.user}`).emit('community:membership:updated', { communityId: String(request.community._id), status })
    res.json({ id: String(request._id), status, communityId: String(request.community._id) })
  } catch (error) { next(error) }
})

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', requireAdmin, async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalFilmmakers,
      totalCinephiles,
      totalFilms,
      totalScripts,
      totalStories,
      totalEquipment,
      pendingReports,
      totalReports,
      suspendedUsers,
      bannedUsers,
      totalAuditActions,
      recentActions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 'preferences.primaryIdentity': 'filmmaker' }),
      User.countDocuments({ 'preferences.primaryIdentity': 'cinephile' }),
      Content.countDocuments({ type: 'film', moderationStatus: 'published' }),
      Content.countDocuments({ type: 'script', moderationStatus: 'published' }),
      Content.countDocuments({ type: 'story', moderationStatus: 'published' }),
      EquipmentListing.countDocuments({ active: true }),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
      User.countDocuments({ accountStatus: 'suspended' }),
      User.countDocuments({ accountStatus: 'banned' }),
      AuditLog.countDocuments(),
      AuditLog.find().sort('-createdAt').limit(10).lean()
    ])

    res.json({
      totalUsers,
      totalFilmmakers,
      totalCinephiles,
      totalFilms,
      totalScripts,
      totalStories,
      totalEquipment,
      pendingReports,
      totalReports,
      suspendedUsers,
      bannedUsers,
      totalAuditActions,
      recentActions
    })
  } catch (error) { next(error) }
})

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const statusFilter = req.query.status

    const filter = {}
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { username: { $regex: safeSearch, $options: 'i' } },
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } }
      ]
    }
    if (statusFilter && ['active', 'suspended', 'banned'].includes(statusFilter)) {
      filter.accountStatus = statusFilter
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name username email roles avatarUrl accountStatus suspendedAt suspendedReason bannedAt bannedReason preferences.primaryIdentity createdAt')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ])

    // Attach content count per user
    const userIds = users.map(u => u._id)
    const contentCounts = await Content.aggregate([
      { $match: { creator: { $in: userIds }, moderationStatus: 'published' } },
      { $group: { _id: '$creator', count: { $sum: 1 } } }
    ])
    const countMap = new Map(contentCounts.map(c => [String(c._id), c.count]))

    const items = users.map(u => ({
      id: u._id,
      name: u.name,
      username: u.username,
      email: u.email,
      roles: u.roles,
      primaryIdentity: u.preferences?.primaryIdentity || 'cinephile',
      accountStatus: u.accountStatus || 'active',
      suspendedAt: u.suspendedAt,
      suspendedReason: u.suspendedReason,
      bannedAt: u.bannedAt,
      bannedReason: u.bannedReason,
      contentCount: countMap.get(String(u._id)) || 0,
      createdAt: u.createdAt,
      avatarUrl: u.avatarUrl
    }))

    res.json({ items, total, page, pages: Math.ceil(total / limit) })
  } catch (error) { next(error) }
})

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
router.get('/users/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found.' })
    const user = await User.findById(req.params.id).select('-passwordHash -passwordResetTokenHash -passwordResetExpiresAt').lean()
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const [contentByType, reportCount, equipment] = await Promise.all([
      Content.aggregate([
        { $match: { creator: user._id } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Report.countDocuments({ contentType: 'user', contentId: user._id }),
      EquipmentListing.countDocuments({ seller: user._id })
    ])

    const contentSummary = {}
    for (const item of contentByType) contentSummary[item._id] = item.count

    res.json({ ...user, contentSummary, equipmentCount: equipment, reportCount })
  } catch (error) { next(error) }
})

// ─── PATCH /api/admin/users/:id/suspend ──────────────────────────────────────
router.patch('/users/:id/suspend', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found.' })
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : ''
    if (!reason) return res.status(400).json({ message: 'A reason for suspension is required.' })

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found.' })
    if (user.roles.includes('admin')) return res.status(403).json({ message: 'Admin accounts cannot be suspended through this endpoint.' })

    // suspendedUntil: optional duration in hours
    const durationHours = req.body.durationHours ? Number(req.body.durationHours) : null
    const suspendedUntil = durationHours && durationHours > 0 ? new Date(Date.now() + durationHours * 3600000) : null

    const previousStatus = user.accountStatus
    user.accountStatus = 'suspended'
    user.suspendedAt = new Date()
    user.suspendedReason = reason
    user.suspendedUntil = suspendedUntil
    await user.save()

    await recordAudit(req.admin, {
      action: 'user_suspended',
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.username,
      reason,
      previousStatus,
      newStatus: 'suspended'
    })

    res.json({ message: `${user.username} has been suspended.`, accountStatus: 'suspended' })
  } catch (error) { next(error) }
})

// ─── PATCH /api/admin/users/:id/restore ──────────────────────────────────────
router.patch('/users/:id/restore', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found.' })
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const previousStatus = user.accountStatus
    user.accountStatus = 'active'
    user.suspendedAt = null
    user.suspendedReason = ''
    user.suspendedUntil = null
    user.bannedAt = null
    user.bannedReason = ''
    await user.save()

    await recordAudit(req.admin, {
      action: 'user_restored',
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.username,
      reason: req.body.reason || 'Account restored by admin',
      previousStatus,
      newStatus: 'active'
    })

    res.json({ message: `${user.username} has been restored.`, accountStatus: 'active' })
  } catch (error) { next(error) }
})

// ─── PATCH /api/admin/users/:id/ban ──────────────────────────────────────────
router.patch('/users/:id/ban', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found.' })
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : ''
    if (!reason) return res.status(400).json({ message: 'A reason for banning is required.' })

    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found.' })
    if (user.roles.includes('admin')) return res.status(403).json({ message: 'Admin accounts cannot be banned.' })

    const previousStatus = user.accountStatus
    user.accountStatus = 'banned'
    user.bannedAt = new Date()
    user.bannedReason = reason
    user.suspendedAt = null
    user.suspendedReason = ''
    user.suspendedUntil = null
    await user.save()

    await recordAudit(req.admin, {
      action: 'user_banned',
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.username,
      reason,
      previousStatus,
      newStatus: 'banned'
    })

    res.json({ message: `${user.username} has been permanently banned.`, accountStatus: 'banned' })
  } catch (error) { next(error) }
})

// ─── GET /api/admin/content ───────────────────────────────────────────────────
router.get('/content', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
    const type = req.query.type
    const status = req.query.status
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''

    const filter = {}
    if (type && ['film', 'script', 'story', 'trailer', 'bts'].includes(type)) filter.type = type
    if (status && ['published', 'removed'].includes(status)) filter.moderationStatus = status
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.title = { $regex: safeSearch, $options: 'i' }
    }

    const [items, total] = await Promise.all([
      Content.find(filter)
        .populate('creator', 'name username')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Content.countDocuments(filter)
    ])

    // Attach report counts
    const contentIds = items.map(c => c._id)
    const reportCounts = await Report.aggregate([
      { $match: { contentType: 'content', contentId: { $in: contentIds } } },
      { $group: { _id: '$contentId', count: { $sum: 1 } } }
    ])
    const reportMap = new Map(reportCounts.map(r => [String(r._id), r.count]))

    res.json({
      items: items.map(c => ({
        ...c,
        reportCount: reportMap.get(String(c._id)) || 0
      })),
      total,
      page,
      pages: Math.ceil(total / limit)
    })
  } catch (error) { next(error) }
})

// ─── PATCH /api/admin/content/:id/remove ─────────────────────────────────────
router.patch('/content/:id/remove', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Content not found.' })
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : ''
    if (!reason) return res.status(400).json({ message: 'A reason for removal is required.' })

    const content = await Content.findById(req.params.id)
    if (!content) return res.status(404).json({ message: 'Content not found.' })

    const previousStatus = content.moderationStatus
    content.moderationStatus = 'removed'
    content.moderatedAt = new Date()
    content.moderatedReason = reason
    content.moderatedBy = req.admin.username
    await content.save()

    await recordAudit(req.admin, {
      action: 'content_removed',
      targetType: 'content',
      targetId: content._id,
      targetLabel: content.title,
      reason,
      previousStatus,
      newStatus: 'removed'
    })

    res.json({ message: 'Content removed from public access.', moderationStatus: 'removed' })
  } catch (error) { next(error) }
})

// ─── PATCH /api/admin/content/:id/restore ────────────────────────────────────
router.patch('/content/:id/restore', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Content not found.' })
    const content = await Content.findById(req.params.id)
    if (!content) return res.status(404).json({ message: 'Content not found.' })

    const previousStatus = content.moderationStatus
    content.moderationStatus = 'published'
    content.moderatedAt = new Date()
    content.moderatedReason = ''
    content.moderatedBy = req.admin.username
    await content.save()

    await recordAudit(req.admin, {
      action: 'content_restored',
      targetType: 'content',
      targetId: content._id,
      targetLabel: content.title,
      reason: req.body.reason || 'Restored by admin',
      previousStatus,
      newStatus: 'published'
    })

    res.json({ message: 'Content restored.', moderationStatus: 'published' })
  } catch (error) { next(error) }
})

// ─── DELETE /api/admin/content/:id ───────────────────────────────────────────
router.delete('/content/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Content not found.' })
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : ''
    if (!reason) return res.status(400).json({ message: 'A reason for permanent deletion is required.' })
    const confirmed = req.body.confirmed === true

    if (!confirmed) return res.status(400).json({ message: 'Permanent deletion requires explicit confirmation.' })

    const content = await Content.findById(req.params.id)
    if (!content) return res.status(404).json({ message: 'Content not found.' })

    const label = content.title
    const contentId = content._id

    // Delete dependent records
    await Promise.all([
      Comment.deleteMany({ content: contentId }),
      Report.deleteMany({ contentType: 'content', contentId })
    ])

    await content.deleteOne()

    await recordAudit(req.admin, {
      action: 'content_deleted_permanently',
      targetType: 'content',
      targetId: contentId,
      targetLabel: label,
      reason
    })

    res.json({ message: 'Content permanently deleted.', deleted: true })
  } catch (error) { next(error) }
})

// ─── GET /api/admin/equipment ─────────────────────────────────────────────────
router.get('/equipment', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
    const statusFilter = req.query.status

    const filter = {}
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { category: { $regex: safeSearch, $options: 'i' } }
      ]
    }
    if (statusFilter === 'active') filter.active = true
    if (statusFilter === 'inactive') filter.active = false

    const [items, total] = await Promise.all([
      EquipmentListing.find(filter)
        .populate('seller', 'name username')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      EquipmentListing.countDocuments(filter)
    ])

    const equipIds = items.map(e => e._id)
    const reportCounts = await Report.aggregate([
      { $match: { contentType: 'equipment', contentId: { $in: equipIds } } },
      { $group: { _id: '$contentId', count: { $sum: 1 } } }
    ])
    const reportMap = new Map(reportCounts.map(r => [String(r._id), r.count]))

    res.json({
      items: items.map(e => ({
        id: e._id,
        title: e.title,
        category: e.category,
        condition: e.condition,
        location: e.location,
        listingType: e.listingType || (e.rentalPrice != null ? 'rent' : e.salePrice != null ? 'sale' : 'exchange'),
        salePrice: e.salePrice,
        rentalPrice: e.rentalPrice,
        active: e.active,
        seller: e.seller,
        createdAt: e.createdAt,
        reportCount: reportMap.get(String(e._id)) || 0
      })),
      total,
      page,
      pages: Math.ceil(total / limit)
    })
  } catch (error) { next(error) }
})

// ─── PATCH /api/admin/equipment/:id/deactivate ────────────────────────────────
router.patch('/equipment/:id/deactivate', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Listing not found.' })
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : ''
    if (!reason) return res.status(400).json({ message: 'A reason is required.' })

    const listing = await EquipmentListing.findById(req.params.id)
    if (!listing) return res.status(404).json({ message: 'Listing not found.' })

    listing.active = false
    await listing.save()

    await recordAudit(req.admin, {
      action: 'equipment_deactivated',
      targetType: 'equipment',
      targetId: listing._id,
      targetLabel: listing.title,
      reason,
      previousStatus: 'active',
      newStatus: 'inactive'
    })

    res.json({ message: 'Equipment listing deactivated.', active: false })
  } catch (error) { next(error) }
})

// ─── PATCH /api/admin/equipment/:id/reactivate ────────────────────────────────
router.patch('/equipment/:id/reactivate', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Listing not found.' })
    const listing = await EquipmentListing.findById(req.params.id)
    if (!listing) return res.status(404).json({ message: 'Listing not found.' })

    listing.active = true
    await listing.save()

    await recordAudit(req.admin, {
      action: 'equipment_reactivated',
      targetType: 'equipment',
      targetId: listing._id,
      targetLabel: listing.title,
      reason: req.body.reason || 'Reactivated by admin',
      previousStatus: 'inactive',
      newStatus: 'active'
    })

    res.json({ message: 'Equipment listing reactivated.', active: true })
  } catch (error) { next(error) }
})

// ─── GET /api/admin/reports ───────────────────────────────────────────────────
router.get('/reports', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
    const status = req.query.status
    const contentType = req.query.contentType

    const filter = {}
    if (status && ['pending', 'under_review', 'resolved', 'dismissed'].includes(status)) filter.status = status
    if (contentType && ['content', 'comment', 'equipment', 'user'].includes(contentType)) filter.contentType = contentType

    const [items, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'name username')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter)
    ])

    res.json({ items, total, page, pages: Math.ceil(total / limit) })
  } catch (error) { next(error) }
})

// ─── PATCH /api/admin/reports/:id ─────────────────────────────────────────────
router.patch('/reports/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Report not found.' })
    const { status, resolutionNote } = req.body
    if (!status || !['under_review', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Provide a valid status: under_review, resolved, or dismissed.' })
    }

    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report not found.' })

    const previousStatus = report.status
    report.status = status
    report.reviewedBy = req.admin.username
    report.reviewedAt = new Date()
    if (typeof resolutionNote === 'string') report.resolutionNote = resolutionNote.trim()
    await report.save()

    await recordAudit(req.admin, {
      action: 'report_updated',
      targetType: 'report',
      targetId: report._id,
      reason: resolutionNote || '',
      previousStatus,
      newStatus: status
    })

    res.json({ message: 'Report updated.', status })
  } catch (error) { next(error) }
})

// ─── GET /api/admin/audit ──────────────────────────────────────────────────────
router.get('/audit', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25))
    const targetType = req.query.targetType

    const filter = {}
    if (targetType && ['user', 'content', 'comment', 'equipment', 'report', 'admin'].includes(targetType)) {
      filter.targetType = targetType
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),
      AuditLog.countDocuments(filter)
    ])

    res.json({ items, total, page, pages: Math.ceil(total / limit) })
  } catch (error) { next(error) }
})

// ─── POST /api/admin/comments/:id/remove ─────────────────────────────────────
router.patch('/comments/:id/remove', requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Comment not found.' })
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : ''
    if (!reason) return res.status(400).json({ message: 'A reason is required.' })

    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ message: 'Comment not found.' })

    // Delete replies too if it's a root comment
    if (!comment.parent) await Comment.deleteMany({ parent: comment._id })
    await comment.deleteOne()

    await recordAudit(req.admin, {
      action: 'comment_removed',
      targetType: 'comment',
      targetId: comment._id,
      reason
    })

    res.json({ message: 'Comment removed.', deleted: true })
  } catch (error) { next(error) }
})

export default router
