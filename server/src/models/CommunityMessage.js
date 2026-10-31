import mongoose from 'mongoose'

const messageAttachmentSchema = new mongoose.Schema({
  id: { type: String, required: true, maxlength: 64 },
  name: { type: String, required: true, maxlength: 160 },
  mimeType: { type: String, required: true, maxlength: 120 },
  size: { type: Number, required: true, min: 1 },
  kind: { type: String, enum: ['image', 'video', 'document'], required: true }
}, { _id: false })

const communityMessageSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true, index: true },
  channel: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  body: { type: String, trim: true, maxlength: 2000, default: '' },
  attachments: { type: [messageAttachmentSchema], default: [] },
  clientMessageId: { type: String, required: true, maxlength: 64 },
  editedAt: { type: Date, default: null }
}, { timestamps: true })

communityMessageSchema.index({ community: 1, channel: 1, createdAt: -1, _id: -1 })
communityMessageSchema.index({ sender: 1, clientMessageId: 1 }, { unique: true })

export default mongoose.model('CommunityMessage', communityMessageSchema)
