import { Router } from 'express'
import mongoose from 'mongoose'
import Notification from '../models/Notification.js'
import { protect } from '../middleware/auth.js'

const router = Router()
const fields = 'name username avatarUrl'

router.get('/unread-count', protect, async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, readAt: null })
    res.json({ unreadCount })
  } catch (error) {
    next(error)
  }
})

function notificationForClient(notification) {
  return {
    _id: notification._id,
    actor: notification.actor,
    content: notification.content,
    comment: notification.comment,
    equipmentListing: notification.equipmentListing ? {
      _id: notification.equipmentListing._id,
      title: notification.equipmentListing.title,
      active: notification.equipmentListing.active
    } : null,
    equipmentRequest: notification.equipmentRequest ? {
      _id: notification.equipmentRequest._id,
      status: notification.equipmentRequest.status,
      buyer: notification.equipmentRequest.buyer
    } : null,
    community: notification.community ? {
      _id: notification.community._id,
      name: notification.community.name,
      slug: notification.community.slug
    } : null,
    communityMembershipRequest: notification.communityMembershipRequest ? {
      _id: notification.communityMembershipRequest._id,
      status: notification.communityMembershipRequest.status,
      message: notification.communityMembershipRequest.message || ''
    } : null,
    type: notification.type,
    readAt: notification.readAt,
    createdAt: notification.createdAt
  }
}

router.get('/', protect, async (req, res, next) => {
  try {
    const [items, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate('actor', fields)
        .populate('content', 'title')
        .populate('equipmentListing', 'title active')
        .populate({ path: 'equipmentRequest', select: 'status buyer', populate: { path: 'buyer', select: fields } })
        .populate('community', 'name slug')
        .populate('communityMembershipRequest', 'status message')
        .sort('-createdAt')
        .limit(50),
      Notification.countDocuments({ recipient: req.user._id, readAt: null })
    ])
    res.json({ notifications: items.map(notificationForClient), unreadCount })
  } catch (error) {
    next(error)
  }
})

router.patch('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, readAt: null }, { $set: { readAt: new Date() } })
    res.json({ unreadCount: 0 })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/read', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Notification not found.' })
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } },
      { new: true }
    )
    if (!notification) {
      const existing = await Notification.exists({ _id: req.params.id, recipient: req.user._id })
      if (!existing) return res.status(404).json({ message: 'Notification not found.' })
    }
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, readAt: null })
    res.json({ unreadCount })
  } catch (error) {
    next(error)
  }
})

export default router
