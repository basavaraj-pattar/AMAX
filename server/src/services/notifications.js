import Notification from '../models/Notification.js'

export async function notifyFilmActivity(req, { recipient, actor, content, comment, type, eventKey }) {
  if (String(recipient) === String(actor)) return null
  if (typeof eventKey !== 'string' || !eventKey) throw new Error('A notification event key is required.')
  const record = { recipient, actor, content, comment, type, eventKey }
  const result = await Notification.updateOne({ eventKey }, { $setOnInsert: record }, { upsert: true })
  const notification = await Notification.findOne({ eventKey })
  if (!notification) throw new Error('Unable to persist the notification.')
  const populated = await notification.populate([
    { path: 'actor', select: 'name username avatarUrl' },
    { path: 'content', select: 'title' }
  ])
  if (result.upsertedCount) {
    const payload = populated.toObject()
    req.app.get('io')?.to(`user:${recipient}`).emit('notification:new', {
      _id: payload._id,
      actor: payload.actor,
      content: payload.content,
      comment: payload.comment,
      type: payload.type,
      readAt: payload.readAt,
      createdAt: payload.createdAt
    })
  }
  return populated
}

export async function notifyCommunityJoinRequest(req, { recipient, actor, community, request }) {
  if (String(recipient) === String(actor)) return null
  const eventKey = `community-join:${request._id}:${recipient}`
  const notificationData = {
    recipient,
    actor,
    community: community._id,
    communityMembershipRequest: request._id,
    type: 'community_join_request',
    eventKey,
    readAt: null
  }

  let notification
  try {
    notification = await Notification.findOneAndUpdate(
      { eventKey },
      { $set: notificationData },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    )
  } catch (error) {
    if (error.code !== 11000) throw error
    notification = await Notification.findOneAndUpdate({ eventKey }, { $set: notificationData }, { returnDocument: 'after' })
  }

  req.app.get('io')?.to(`user:${recipient}`).emit('notification:new', {
    _id: notification?._id,
    type: 'community_join_request'
  })
  return notification
}

export async function resolveCommunityJoinNotifications(req, requestId) {
  const filter = { type: 'community_join_request', communityMembershipRequest: requestId }
  const notifications = await Notification.find(filter).select('recipient').lean()
  if (!notifications.length) return

  await Notification.updateMany({ ...filter, readAt: null }, { $set: { readAt: new Date() } })
  const recipientIds = [...new Set(notifications.map(item => String(item.recipient)))]
  for (const recipientId of recipientIds) {
    req.app.get('io')?.to(`user:${recipientId}`).emit('notification:new', { type: 'community_join_request' })
  }
}
