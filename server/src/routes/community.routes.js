import { Router } from 'express'
import mongoose from 'mongoose'
import Community from '../models/Community.js'
import CommunityMessage from '../models/CommunityMessage.js'
import CommunityMembershipRequest from '../models/CommunityMembershipRequest.js'
import { markMessageAttachmentsAttached, resolveMessageAttachments } from '../services/message-attachments.js'
import { optionalProtect, protect } from '../middleware/auth.js'
import { publicCommunity } from '../services/community.js'
import { validateMessageInput } from '../services/messaging.js'
import { notifyCommunityJoinRequest, resolveCommunityJoinNotifications } from '../services/notifications.js'

const router = Router()
const PAGE_SIZE = 50
const messageSendWindows = new Map()

function isMember(community, userId) {
  return community.members.some(member => String(member?._id || member) === String(userId))
}

function isManager(community, user) {
  return user.roles?.includes('admin')
    || String(community.owner?._id || community.owner || '') === String(user._id)
    || community.moderators.some(moderator => String(moderator?._id || moderator) === String(user._id))
}

async function getCommunity(communityId) {
  if (!mongoose.isValidObjectId(communityId)) return null
  return Community.findById(communityId)
}

function serializeCommunityMessage(message) {
  return {
    id: String(message._id),
    communityId: String(message.community),
    channelId: String(message.channel),
    senderId: String(message.sender?._id || message.sender),
    senderName: message.sender?.name || 'Community member',
    senderUsername: message.sender?.username || '',
    senderAvatarUrl: message.sender?.avatarUrl || '',
    body: message.body,
    attachments: (message.attachments || []).map(attachment => ({ id: attachment.id, name: attachment.name, mimeType: attachment.mimeType, size: attachment.size, kind: attachment.kind })),
    clientMessageId: message.clientMessageId,
    createdAt: message.createdAt,
    editedAt: message.editedAt
  }
}

async function submitMembershipRequest(req, res, next) {
  try {
    const community = await getCommunity(req.params.communityId || req.params.id)
    if (!community) return res.status(404).json({ message: 'Community not found.' })
    if (isMember(community, req.user._id)) return res.json({ status: 'member', community: publicCommunity(community, req.user._id, 'member', isManager(community, req.user)) })

    const now = new Date()
    let request
    try {
      request = await CommunityMembershipRequest.findOneAndUpdate(
        { community: community._id, user: req.user._id },
        { $set: { status: 'pending', requestedAt: now, reviewedAt: null, reviewedByUser: null, reviewedByAdmin: null, message: typeof req.body.message === 'string' ? req.body.message.trim().slice(0, 500) : '' } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      )
    } catch (error) {
      if (error.code !== 11000) throw error
      request = await CommunityMembershipRequest.findOne({ community: community._id, user: req.user._id })
    }

    const io = req.app.get('io')
    if (request?.status === 'pending') {
      const requesterId = String(req.user._id)
      const managerIds = [...new Set([community.owner, ...community.moderators].filter(Boolean).map(String))]
        .filter(userId => userId !== requesterId)
      await Promise.all(managerIds.map(recipient => notifyCommunityJoinRequest(req, {
        recipient,
        actor: req.user._id,
        community,
        request
      })))
      if (io && managerIds.length) {
        io.to(managerIds.map(userId => `user:${userId}`)).emit('community:request:new', { communityId: String(community._id), requestId: String(request._id) })
      }
    }
    res.status(request?.status === 'pending' ? 202 : 200).json({ status: request?.status || 'pending', requestId: String(request?._id || ''), community: publicCommunity(community, req.user._id, request?.status || 'pending', isManager(community, req.user)) })
  } catch (error) { next(error) }
}

router.get('/', optionalProtect, async (req, res, next) => {
  try {
    const communities = await Community.find().sort({ name: 1 }).lean()
    const requests = req.user ? await CommunityMembershipRequest.find({ user: req.user._id, community: { $in: communities.map(community => community._id) } }).select('community status').lean() : []
    const requestStatuses = new Map(requests.map(request => [String(request.community), request.status]))
    res.json(communities.map(community => publicCommunity(community, req.user?._id, requestStatuses.get(String(community._id)) || 'none', Boolean(req.user?.roles?.includes('admin')))))
  } catch (error) { next(error) }
})

router.get('/mine', protect, async (req, res, next) => {
  try {
    const [joined, requests] = await Promise.all([
      Community.find({ members: req.user._id }).sort({ lastActivityAt: -1 }).lean(),
      CommunityMembershipRequest.find({ user: req.user._id, status: 'pending' }).populate('community').sort({ requestedAt: -1 }).lean()
    ])
    res.json({
      joined: joined.map(community => publicCommunity(community, req.user._id, 'member', Boolean(req.user.roles?.includes('admin')))),
      pending: requests.filter(request => request.community).map(request => ({
        ...publicCommunity(request.community, req.user._id, 'pending', Boolean(req.user.roles?.includes('admin'))),
        requestId: String(request._id),
        requestedAt: request.requestedAt
      }))
    })
  } catch (error) { next(error) }
})

router.post('/', protect, async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''
    if (name.length < 3 || name.length > 80) return res.status(400).json({ message: 'Community names must be 3 to 80 characters.' })
    if (description.length > 500) return res.status(400).json({ message: 'Community descriptions must be 500 characters or fewer.' })
    const slug = name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64)
    if (!slug) return res.status(400).json({ message: 'Use letters or numbers in the community name.' })
    const existing = await Community.exists({ slug })
    if (existing) return res.status(409).json({ message: 'A community with that name already exists.' })
    let community
    try {
      community = await Community.create({
        name, slug, description, owner: req.user._id, moderators: [req.user._id], members: [req.user._id],
        channels: [{ name: 'General', slug: 'general', description: 'Start the conversation.' }]
      })
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: 'A community with that name already exists.' })
      throw error
    }
    res.status(201).json(publicCommunity(community, req.user._id, 'member', Boolean(req.user.roles?.includes('admin'))))
  } catch (error) { next(error) }
})

router.post('/:communityId/requests', protect, submitMembershipRequest)
// Keep the old join URL safe for any client still using it: joining now always
// creates an approval request instead of granting immediate access.
router.post('/:id/join', protect, submitMembershipRequest)

router.post('/:communityId/channels', protect, async (req, res, next) => {
  try {
    const community = await getCommunity(req.params.communityId)
    if (!community) return res.status(404).json({ message: 'Community not found.' })
    if (!isManager(community, req.user)) return res.status(403).json({ message: 'Only community owners and moderators can add channels.' })
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''
    if (name.length < 2 || name.length > 40) return res.status(400).json({ message: 'Channel names must be 2 to 40 characters.' })
    if (description.length > 180) return res.status(400).json({ message: 'Channel descriptions must be 180 characters or fewer.' })
    const slug = name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
    if (!slug) return res.status(400).json({ message: 'Use letters or numbers in the channel name.' })
    if (community.channels.some(channel => channel.slug === slug)) return res.status(409).json({ message: 'A channel with that name already exists.' })
    community.channels.push({ name, slug, description })
    await community.save()
    const channel = community.channels[community.channels.length - 1]
    const serializedChannel = { id: String(channel._id), name: channel.name, slug: channel.slug, description: channel.description || '' }
    req.app.get('io')?.to(`community:${community._id}`).emit('community:channel:new', { communityId: String(community._id), channel: serializedChannel })
    res.status(201).json(serializedChannel)
  } catch (error) { next(error) }
})

router.get('/:communityId/requests', protect, async (req, res, next) => {
  try {
    const community = await getCommunity(req.params.communityId)
    if (!community) return res.status(404).json({ message: 'Community not found.' })
    if (!isManager(community, req.user)) return res.status(403).json({ message: 'Only community owners and moderators can review requests.' })
    const requests = await CommunityMembershipRequest.find({ community: community._id, status: 'pending' })
      .populate('user', 'name username avatarUrl')
      .sort({ requestedAt: 1 })
      .limit(100)
      .lean()
    res.json(requests.filter(request => request.user).map(request => ({
      id: String(request._id),
      message: request.message || '',
      requestedAt: request.requestedAt,
      user: { id: String(request.user._id), name: request.user.name, username: request.user.username, avatarUrl: request.user.avatarUrl || '' }
    })))
  } catch (error) { next(error) }
})

router.patch('/:communityId/requests/:requestId', protect, async (req, res, next) => {
  try {
    const community = await getCommunity(req.params.communityId)
    if (!community) return res.status(404).json({ message: 'Community not found.' })
    if (!isManager(community, req.user)) return res.status(403).json({ message: 'Only community owners and moderators can review requests.' })
    const decision = req.body.decision
    if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ message: 'Choose approve or reject.' })
    if (!mongoose.isValidObjectId(req.params.requestId)) return res.status(404).json({ message: 'Request not found.' })

    const status = decision === 'approve' ? 'approved' : 'rejected'
    const request = await CommunityMembershipRequest.findOneAndUpdate(
      { _id: req.params.requestId, community: community._id, status: 'pending' },
      { $set: { status, reviewedAt: new Date(), reviewedByUser: req.user._id, reviewedByAdmin: null } },
      { new: true }
    )
    if (!request) return res.status(409).json({ message: 'This request has already been reviewed.' })

    if (decision === 'approve') {
      await Community.updateOne({ _id: community._id }, { $addToSet: { members: request.user }, $set: { lastActivityAt: new Date() } })
    }
    await resolveCommunityJoinNotifications(req, request._id)
    const io = req.app.get('io')
    if (io) io.to(`user:${request.user}`).emit('community:membership:updated', { communityId: String(community._id), status })
    res.json({ id: String(request._id), status, communityId: String(community._id) })
  } catch (error) { next(error) }
})

router.get('/:communityId/channels', protect, async (req, res, next) => {
  try {
    const community = await getCommunity(req.params.communityId)
    if (!community || !isMember(community, req.user._id)) return res.status(404).json({ message: 'Community space not found.' })
    res.json({
      community: publicCommunity(community, req.user._id, 'member', isManager(community, req.user)),
      channels: community.channels.map(channel => ({ id: String(channel._id), name: channel.name, slug: channel.slug, description: channel.description || '' }))
    })
  } catch (error) { next(error) }
})

router.get('/:communityId/channels/:channelId/messages', protect, async (req, res, next) => {
  try {
    const community = await getCommunity(req.params.communityId)
    if (!community || !isMember(community, req.user._id)) return res.status(404).json({ message: 'Community space not found.' })
    if (!mongoose.isValidObjectId(req.params.channelId) || !community.channels.some(channel => String(channel._id) === req.params.channelId)) return res.status(404).json({ message: 'Discussion channel not found.' })

    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || PAGE_SIZE, 1), PAGE_SIZE)
    const filter = { community: community._id, channel: req.params.channelId }
    if (typeof req.query.before === 'string') {
      const before = new Date(req.query.before)
      if (Number.isNaN(before.getTime())) return res.status(400).json({ message: 'Invalid message cursor.' })
      filter.createdAt = { $lt: before }
      if (typeof req.query.beforeId === 'string' && mongoose.isValidObjectId(req.query.beforeId)) {
        delete filter.createdAt
        filter.$or = [{ createdAt: { $lt: before } }, { createdAt: before, _id: { $lt: req.query.beforeId } }]
      }
    }
    const records = await CommunityMessage.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).populate('sender', 'name username avatarUrl').lean()
    const hasMore = records.length > limit
    const page = records.slice(0, limit).reverse()
    res.json({
      messages: page.map(serializeCommunityMessage),
      hasMore,
      nextCursor: hasMore && page.length ? { createdAt: page[0].createdAt, id: String(page[0]._id) } : null
    })
  } catch (error) { next(error) }
})

router.post('/:communityId/channels/:channelId/messages', protect, async (req, res, next) => {
  try {
    const community = await getCommunity(req.params.communityId)
    if (!community || !isMember(community, req.user._id)) return res.status(404).json({ message: 'Community space not found.' })
    const channel = community.channels.find(item => String(item._id) === req.params.channelId)
    if (!mongoose.isValidObjectId(req.params.channelId) || !channel) return res.status(404).json({ message: 'Discussion channel not found.' })

    const attachmentIds = req.body.attachmentIds ?? []
    const { body, clientMessageId } = validateMessageInput(req.body.body, req.body.clientMessageId, 2000, Array.isArray(attachmentIds) && attachmentIds.length > 0)
    const existingMessage = await CommunityMessage.findOne({ sender: req.user._id, clientMessageId }).populate('sender', 'name username avatarUrl')
    if (existingMessage) {
      if (String(existingMessage.community) !== String(community._id) || String(existingMessage.channel) !== String(channel._id)) return res.status(409).json({ message: 'This message request ID has already been used.' })
      await markMessageAttachmentsAttached(req.user._id, existingMessage.attachments || [])
      return res.status(200).json(serializeCommunityMessage(existingMessage))
    }
    const attachments = await resolveMessageAttachments(req.user._id, attachmentIds)
    const now = Date.now()
    const senderId = String(req.user._id)
    const sendWindow = messageSendWindows.get(senderId)
    if (sendWindow && now - sendWindow.startedAt < 60_000 && sendWindow.count >= 60) return res.status(429).json({ message: 'You are sending messages too quickly. Please wait a moment.' })
    if (!sendWindow || now - sendWindow.startedAt >= 60_000) messageSendWindows.set(senderId, { startedAt: now, count: 1 })
    else sendWindow.count += 1

    let message
    let duplicate = false
    try {
      message = await CommunityMessage.create({ community: community._id, channel: channel._id, sender: req.user._id, body, attachments, clientMessageId })
      message = await CommunityMessage.findById(message._id).populate('sender', 'name username avatarUrl')
    } catch (error) {
      if (error.code !== 11000) throw error
      message = await CommunityMessage.findOne({ sender: req.user._id, clientMessageId }).populate('sender', 'name username avatarUrl')
      if (!message || String(message.community) !== String(community._id) || String(message.channel) !== String(channel._id)) return res.status(409).json({ message: 'This message request ID has already been used.' })
      duplicate = true
    }

    if (duplicate) await markMessageAttachmentsAttached(req.user._id, message.attachments || [])

    if (!duplicate) {
      await markMessageAttachmentsAttached(req.user._id, attachments)
      await Community.updateOne({ _id: community._id }, { $set: { lastActivityAt: message.createdAt } })
      const data = serializeCommunityMessage(message)
      const io = req.app.get('io')
      if (io) io.to(`community:${community._id}`).emit('community:message:new', data)
    }
    res.status(duplicate ? 200 : 201).json(serializeCommunityMessage(message))
  } catch (error) { next(error) }
})

export default router
