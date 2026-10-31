import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  equipmentListing: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipmentListing' },
  equipmentRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipmentRequest' },
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  communityMembershipRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityMembershipRequest' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  eventKey: { type: String, unique: true, sparse: true },
  type: { type: String, enum: ['like', 'comment', 'reply', 'equipment_request', 'equipment_request_approved', 'community_join_request'], required: true },
  readAt: { type: Date, default: null }
}, { timestamps: true })

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
