import mongoose from 'mongoose'

const messageAttachmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, maxlength: 64 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  storageName: { type: String, required: true, unique: true },
  name: { type: String, required: true, maxlength: 160 },
  mimeType: { type: String, required: true, maxlength: 120 },
  size: { type: Number, required: true, min: 1 },
  kind: { type: String, enum: ['image', 'video', 'document'], required: true },
  status: { type: String, enum: ['pending', 'attached', 'expired'], default: 'pending', index: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), index: true }
}, { timestamps: true })

messageAttachmentSchema.index({ owner: 1, status: 1, createdAt: -1 })

export default mongoose.model('MessageAttachment', messageAttachmentSchema)
