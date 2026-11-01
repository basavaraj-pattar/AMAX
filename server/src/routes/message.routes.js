import { Router } from 'express'
import mongoose from 'mongoose'
import { randomUUID } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import MessageAttachment from '../models/MessageAttachment.js'
import Community from '../models/Community.js'
import CommunityMessage from '../models/CommunityMessage.js'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'
import { directConversationKey, validateMessageInput } from '../services/messaging.js'
import { cleanupExpiredMessageAttachments, markMessageAttachmentsAttached, MAX_MESSAGE_ATTACHMENT_BYTES, resolveMessageAttachments } from '../services/message-attachments.js'
import { messageAttachmentDirectory } from '../config/storage.js'

const router = Router()
const MAX_MESSAGE_LENGTH = 2000
const PAGE_SIZE = 50
const messageSendWindows = new Map()
const allowedAttachmentTypes = {
  '.jpg': ['image', 'image/jpeg'], '.jpeg': ['image', 'image/jpeg'], '.png': ['image', 'image/png'],
  '.gif': ['image', 'image/gif'], '.webp': ['image', 'image/webp'],
  '.mp4': ['video', 'video/mp4'], '.webm': ['video', 'video/webm'], '.mov': ['video', 'video/quicktime'],
  '.pdf': ['document', 'application/pdf'], '.txt': ['document', 'text/plain'], '.rtf': ['document', 'application/rtf'],
  '.doc': ['document', 'application/msword'], '.docx': ['document', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xls': ['document', 'application/vnd.ms-excel'], '.xlsx': ['document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.csv': ['document', 'text/csv'], '.ppt': ['document', 'application/vnd.ms-powerpoint'],
  '.pptx': ['document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  '.odt': ['document', 'application/vnd.oasis.opendocument.text'], '.ods': ['document', 'application/vnd.oasis.opendocument.spreadsheet'],
  '.odp': ['document', 'application/vnd.oasis.opendocument.presentation']
}

function attachmentSizeGuard(maxBytes = MAX_MESSAGE_ATTACHMENT_BYTES) {
  let receivedBytes = 0
  return new Transform({
    transform(chunk, _encoding, callback) {
      receivedBytes += chunk.length
      if (receivedBytes > maxBytes) {
        callback(Object.assign(new Error('Each chat attachment must be 50 MB or smaller.'), { status: 413 }))
        return
      }
      callback(null, chunk)
    }
  })
}

function safeOriginalName(headerValue) {
  let decoded = ''
  try { decoded = decodeURIComponent(String(headerValue || '')) } catch {}
  return basename(decoded.replaceAll('\\', '/')).replace(/[\\0-\\x1f\\x7f]/g, '').trim().slice(0, 160)
}

function publicAttachment(attachment) {
  return { id: attachment.id, name: attachment.name, mimeType: attachment.mimeType, size: attachment.size, kind: attachment.kind }
}

router.use(protect)

router.post('/attachments', async (req, res, next) => {
  const name = safeOriginalName(req.headers['x-file-name'])
  const extension = extname(name).toLowerCase()
  const attachmentType = allowedAttachmentTypes[extension]
  if (!name || !attachmentType) return res.status(415).json({ message: 'Choose an image, video, or document in a supported format.' })
  const contentLength = Number(req.headers['content-length'])
  if (Number.isFinite(contentLength) && contentLength > MAX_MESSAGE_ATTACHMENT_BYTES) {
    return res.status(413).json({ message: 'Each chat attachment must be 50 MB or smaller.' })
  }

  const now = new Date()
  try {
    await cleanupExpiredMessageAttachments()
    const pendingCount = await MessageAttachment.countDocuments({ owner: req.user._id, status: 'pending', expiresAt: { $gt: now } })
    if (pendingCount >= 10) return res.status(429).json({ message: 'Send or remove your pending files before adding more attachments.' })
  } catch (error) { return next(error) }

  const id = randomUUID()
  const storageName = `${id}${extension}`
  const finalPath = join(messageAttachmentDirectory, storageName)
  const temporaryPath = `${finalPath}.uploading`
  try {
    await mkdir(messageAttachmentDirectory, { recursive: true })
    await pipeline(req, attachmentSizeGuard(), createWriteStream(temporaryPath, { flags: 'wx' }))
    const uploaded = await stat(temporaryPath)
    if (!uploaded.size) {
      await rm(temporaryPath, { force: true })
      return res.status(400).json({ message: 'The selected file is empty.' })
    }
    await rename(temporaryPath, finalPath)
    const attachment = await MessageAttachment.create({
      id, owner: req.user._id, storageName, name, mimeType: attachmentType[1], size: uploaded.size, kind: attachmentType[0]
    })
    res.status(201).json({ attachment: publicAttachment(attachment) })
  } catch (error) {
    await Promise.all([rm(temporaryPath, { force: true }).catch(() => {}), rm(finalPath, { force: true }).catch(() => {})])
    next(error)
  }
})

router.delete('/attachments/:attachmentId', async (req, res, next) => {
  try {
    if (!/^[a-f0-9-]{32,36}$/i.test(req.params.attachmentId)) return res.status(404).json({ message: 'Attachment not found.' })
    const attachment = await MessageAttachment.findOneAndDelete({
      id: req.params.attachmentId,
      owner: req.user._id,
      status: 'pending'
    }).select('storageName').lean()
    if (!attachment) return res.status(404).json({ message: 'Attachment not found.' })
    await rm(join(messageAttachmentDirectory, attachment.storageName), { force: true })
    res.status(204).end()
  } catch (error) { next(error) }
})

router.get('/attachments/:attachmentId', async (req, res, next) => {
  try {
    if (!/^[a-f0-9-]{32,36}$/i.test(req.params.attachmentId)) return res.status(404).json({ message: 'Attachment not found.' })
    const attachment = await MessageAttachment.findOne({ id: req.params.attachmentId, status: 'attached' }).lean()
    if (!attachment) return res.status(404).json({ message: 'Attachment not found.' })

    const directMessage = await Message.findOne({ 'attachments.id': attachment.id }).select('conversation').lean()
    let authorized = directMessage && await Conversation.exists({ _id: directMessage.conversation, 'participants.user': req.user._id })
    if (!authorized) {
      const communityMessage = await CommunityMessage.findOne({ 'attachments.id': attachment.id }).select('community').lean()
      if (communityMessage) authorized = await Community.exists({ _id: communityMessage.community, members: req.user._id })
    }
    if (!authorized) return res.status(404).json({ message: 'Attachment not found.' })

    const filePath = join(messageAttachmentDirectory, attachment.storageName)
    const file = await stat(filePath).catch(() => null)
    if (!file?.isFile()) return res.status(404).json({ message: 'Attachment file is no longer available.' })
    const safeFallback = attachment.name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')
    const disposition = attachment.kind === 'document' ? 'attachment' : 'inline'
    res.setHeader('Content-Type', attachment.mimeType)
    res.setHeader('Content-Length', file.size)
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeFallback}"; filename*=UTF-8''${encodeURIComponent(attachment.name)}`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
    createReadStream(filePath).on('error', next).pipe(res)
  } catch (error) { next(error) }
})

function isParticipant(conversation, userId) {
  return conversation.participants.some(participant => String(participant.user?._id || participant.user) === String(userId))
}

function publicMessage(message) {
  return {
    id: String(message._id),
    conversationId: String(message.conversation),
    senderId: String(message.sender?._id || message.sender),
    senderName: message.sender?.name,
    body: message.body,
    attachments: (message.attachments || []).map(publicAttachment),
    clientMessageId: message.clientMessageId,
    createdAt: message.createdAt,
    editedAt: message.editedAt
  }
}

function conversationSummary(conversation, userId, unreadCount = 0) {
  const otherParticipant = conversation.participants.find(participant => String(participant.user?._id || participant.user) !== String(userId))
  const otherUser = otherParticipant?.user
  return {
    id: String(conversation._id),
    type: conversation.type,
    participant: otherUser ? {
      id: String(otherUser._id),
      name: otherUser.name,
      username: otherUser.username,
      avatarUrl: otherUser.avatarUrl || ''
    } : null,
    lastMessage: conversation.lastMessage ? publicMessage(conversation.lastMessage) : null,
    lastActivityAt: conversation.lastActivityAt,
    unreadCount
  }
}

async function findAuthorizedConversation(conversationId, userId) {
  if (!mongoose.isValidObjectId(conversationId)) return null
  const conversation = await Conversation.findById(conversationId)
  return conversation && isParticipant(conversation, userId) ? conversation : null
}

router.get('/users', async (req, res, next) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (query.length < 2) return res.json([])
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: escaped, $options: 'i' } },
        { name: { $regex: escaped, $options: 'i' } }
      ]
    }).select('name username avatarUrl').sort({ username: 1 }).limit(20).lean()
    res.json(users.map(user => ({ id: String(user._id), name: user.name, username: user.username, avatarUrl: user.avatarUrl || '' })))
  } catch (error) { next(error) }
})

router.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ 'participants.user': req.user._id })
      .populate('participants.user', 'name username avatarUrl')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name' } })
      .sort({ lastActivityAt: -1 })
      .limit(100)
      .lean()
    const unreadFilters = conversations.map(conversation => {
      const participant = conversation.participants.find(item => String(item.user?._id) === String(req.user._id))
      return {
        conversation: conversation._id,
        sender: { $ne: req.user._id },
        createdAt: { $gt: participant?.lastReadAt || new Date(0) }
      }
    })
    const unreadCounts = unreadFilters.length
      ? await Message.aggregate([
          { $match: { $or: unreadFilters } },
          { $group: { _id: '$conversation', count: { $sum: 1 } } }
        ])
      : []
    const unreadByConversation = new Map(unreadCounts.map(item => [String(item._id), item.count]))
    const result = conversations.map(conversation => conversationSummary(
      conversation,
      req.user._id,
      unreadByConversation.get(String(conversation._id)) || 0
    ))
    res.json(result)
  } catch (error) { next(error) }
})

router.post('/conversations', async (req, res, next) => {
  try {
    const recipientId = req.body.recipientId
    if (!mongoose.isValidObjectId(recipientId) || String(recipientId) === String(req.user._id)) {
      return res.status(400).json({ message: 'Choose a valid recipient.' })
    }
    const recipient = await User.findById(recipientId).select('name username avatarUrl')
    if (!recipient) return res.status(404).json({ message: 'That account could not be found.' })

    const key = directConversationKey(req.user._id, recipient._id)
    let conversation
    try {
      conversation = await Conversation.findOneAndUpdate(
        { participantKey: key },
        { $setOnInsert: { participantKey: key, participants: [{ user: req.user._id }, { user: recipient._id }] } },
        { returnDocument: 'after', upsert: true, runValidators: true }
      )
    } catch (error) {
      if (error.code !== 11000) throw error
      conversation = await Conversation.findOne({ participantKey: key })
    }
    if (!conversation) return res.status(500).json({ message: 'Unable to open this conversation.' })
    await conversation.populate('participants.user', 'name username avatarUrl')
    await conversation.populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name' } })
    res.status(200).json(conversationSummary(conversation, req.user._id))
  } catch (error) { next(error) }
})

router.get('/conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const conversation = await findAuthorizedConversation(req.params.conversationId, req.user._id)
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' })
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || PAGE_SIZE, 1), PAGE_SIZE)
    const filter = { conversation: conversation._id }
    if (typeof req.query.before === 'string') {
      const before = new Date(req.query.before)
      if (Number.isNaN(before.getTime())) return res.status(400).json({ message: 'Invalid message cursor.' })
      if (typeof req.query.beforeId === 'string' && mongoose.isValidObjectId(req.query.beforeId)) {
        filter.$or = [
          { createdAt: { $lt: before } },
          { createdAt: before, _id: { $lt: req.query.beforeId } }
        ]
      } else {
        filter.createdAt = { $lt: before }
      }
    }
    const messages = await Message.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).populate('sender', 'name').lean()
    const hasMore = messages.length > limit
    const page = messages.slice(0, limit).reverse()
    res.json({
      messages: page.map(publicMessage),
      hasMore,
      nextCursor: hasMore && page.length ? { createdAt: page[0].createdAt, id: String(page[0]._id) } : null
    })
  } catch (error) { next(error) }
})

router.post('/conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const conversation = await findAuthorizedConversation(req.params.conversationId, req.user._id)
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' })
    const attachmentIds = req.body.attachmentIds ?? []
    const { body, clientMessageId } = validateMessageInput(req.body.body, req.body.clientMessageId, MAX_MESSAGE_LENGTH, Array.isArray(attachmentIds) && attachmentIds.length > 0)
    const existingMessage = await Message.findOne({ sender: req.user._id, clientMessageId }).populate('sender', 'name')
    if (existingMessage) {
      if (String(existingMessage.conversation) !== String(conversation._id)) return res.status(409).json({ message: 'This message request ID has already been used.' })
      await markMessageAttachmentsAttached(req.user._id, existingMessage.attachments || [])
      return res.status(200).json(publicMessage(existingMessage))
    }
    const attachments = await resolveMessageAttachments(req.user._id, attachmentIds)
    const now = Date.now()
    const senderId = String(req.user._id)
    const sendWindow = messageSendWindows.get(senderId)
    if (sendWindow && now - sendWindow.startedAt < 60_000 && sendWindow.count >= 60) {
      return res.status(429).json({ message: 'You are sending messages too quickly. Please wait a moment.' })
    }
    if (!sendWindow || now - sendWindow.startedAt >= 60_000) messageSendWindows.set(senderId, { startedAt: now, count: 1 })
    else sendWindow.count += 1

    let message
    let duplicate = false
    try {
      message = await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        body,
        attachments,
        clientMessageId
      })
    } catch (error) {
      if (error.code !== 11000) throw error
      message = await Message.findOne({ sender: req.user._id, clientMessageId }).populate('sender', 'name')
      if (!message || String(message.conversation) !== String(conversation._id)) {
        return res.status(409).json({ message: 'This message request ID has already been used.' })
      }
      duplicate = true
    }
    if (duplicate) await markMessageAttachmentsAttached(req.user._id, message.attachments || [])
    if (!duplicate) {
      message = await Message.findById(message._id).populate('sender', 'name')
      await markMessageAttachmentsAttached(req.user._id, attachments)
    }
    if (!conversation.lastActivityAt || conversation.lastActivityAt <= message.createdAt) {
      conversation.lastMessage = message._id
      conversation.lastActivityAt = message.createdAt
    }
    const senderParticipant = conversation.participants.find(item => String(item.user) === String(req.user._id))
    if (senderParticipant && senderParticipant.lastReadAt < message.createdAt) senderParticipant.lastReadAt = message.createdAt
    await conversation.save()

    const data = publicMessage(message)
    const io = req.app.get('io')
    if (!duplicate && io) {
      io.to(`conversation:${conversation._id}`).emit('message:new', data)
      io.to(conversation.participants.map(item => `user:${item.user}`)).emit('conversation:updated', { conversationId: String(conversation._id) })
    }
    res.status(duplicate ? 200 : 201).json(data)
  } catch (error) { next(error) }
})

router.post('/conversations/:conversationId/read', async (req, res, next) => {
  try {
    const conversation = await findAuthorizedConversation(req.params.conversationId, req.user._id)
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' })
    const now = new Date()
    await Conversation.updateOne(
      { _id: conversation._id, 'participants.user': req.user._id },
      { $set: { 'participants.$.lastReadAt': now } }
    )
    const io = req.app.get('io')
    if (io) {
      io.to(conversation.participants.map(item => `user:${item.user}`)).emit('conversation:read', { conversationId: String(conversation._id), userId: String(req.user._id) })
      io.to(`conversation:${conversation._id}`).emit('conversation:updated', { conversationId: String(conversation._id) })
    }
    res.json({ conversationId: String(conversation._id), lastReadAt: now })
  } catch (error) { next(error) }
})

export default router
