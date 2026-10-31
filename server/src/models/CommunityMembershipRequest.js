import mongoose from 'mongoose'

const communityMembershipRequestSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  message: { type: String, trim: true, maxlength: 500, default: '' },
  requestedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date, default: null },
  reviewedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount', default: null }
}, { timestamps: true })

communityMembershipRequestSchema.index({ community: 1, user: 1 }, { unique: true })
communityMembershipRequestSchema.index({ community: 1, status: 1, requestedAt: 1 })

export default mongoose.model('CommunityMembershipRequest', communityMembershipRequestSchema)
