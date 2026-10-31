import MessageAttachment from '../models/MessageAttachment.js'
import { rm } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const MAX_MESSAGE_ATTACHMENTS = 5
export const MAX_MESSAGE_ATTACHMENT_BYTES = 50 * 1024 * 1024
const attachmentDirectory = join(dirname(fileURLToPath(import.meta.url)), '../../storage/message-attachments')

export async function cleanupExpiredMessageAttachments() {
  const now = new Date()
  await MessageAttachment.updateMany(
    { status: 'pending', expiresAt: { $lte: now } },
    { $set: { status: 'expired' } }
  )
  const expired = await MessageAttachment.find({ status: 'expired', expiresAt: { $lte: now } }).select('_id storageName').lean()
  await Promise.all(expired.map(async attachment => {
    if (basename(attachment.storageName) === attachment.storageName) {
      await rm(join(attachmentDirectory, attachment.storageName), { force: true }).catch(() => {})
    }
  }))
  if (expired.length) await MessageAttachment.deleteMany({ _id: { $in: expired.map(attachment => attachment._id) }, status: 'expired' })
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
