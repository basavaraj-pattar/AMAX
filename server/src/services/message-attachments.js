import MessageAttachment from '../models/MessageAttachment.js'
import { rm } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { messageAttachmentDirectory } from '../config/storage.js'

export const MAX_MESSAGE_ATTACHMENTS = 5
export const MAX_MESSAGE_ATTACHMENT_BYTES = 50 * 1024 * 1024

export async function cleanupExpiredMessageAttachments() {
  const now = new Date()
  await MessageAttachment.updateMany(
    { status: 'pending', expiresAt: { $lte: now } },
    { $set: { status: 'expired' } }
  )
  const expired = await MessageAttachment.find({ status: 'expired', expiresAt: { $lte: now } }).select('_id storageName').lean()
  const removedIds = []
  await Promise.all(expired.map(async attachment => {
    if (basename(attachment.storageName) !== attachment.storageName) {
      console.error(`Skipping expired attachment with an unsafe storage name: ${attachment._id}`)
      return
    }
    try {
      await rm(join(messageAttachmentDirectory, attachment.storageName), { force: true })
      removedIds.push(attachment._id)
    } catch (error) {
      console.error(`Unable to remove expired message attachment ${attachment._id}:`, error)
    }
  }))
  if (removedIds.length) {
    await MessageAttachment.deleteMany({ _id: { $in: removedIds }, status: 'expired' })
  }
}

export async function resolveMessageAttachments(ownerId, ids) {
  if (!Array.isArray(ids) || ids.length > MAX_MESSAGE_ATTACHMENTS) {
    throw Object.assign(new Error(`Attach up to ${MAX_MESSAGE_ATTACHMENTS} files to a message.`), { status: 400 })
  }
  if (ids.some(id => typeof id !== 'string' || !/^[a-f0-9-]{32,36}$/i.test(id)) || new Set(ids).size !== ids.length) {
    throw Object.assign(new Error('One or more attachments are invalid.'), { status: 400 })
  }
  if (!ids.length) return []
  const records = await MessageAttachment.find({ id: { $in: ids }, owner: ownerId, status: 'pending', expiresAt: { $gt: new Date() } }).lean()
  if (records.length !== ids.length) {
    throw Object.assign(new Error('An attachment expired or is no longer available. Please add it again.'), { status: 400 })
  }
  const byId = new Map(records.map(record => [record.id, record]))
  return ids.map(id => {
    const record = byId.get(id)
    return { id: record.id, name: record.name, mimeType: record.mimeType, size: record.size, kind: record.kind }
  })
}

export async function markMessageAttachmentsAttached(ownerId, attachments) {
  const ids = attachments.map(attachment => attachment.id)
  if (!ids.length) return
  await MessageAttachment.updateMany(
    { id: { $in: ids }, owner: ownerId, status: 'pending' },
    { $set: { status: 'attached' }, $unset: { expiresAt: 1 } }
  )
}
