import mongoose from 'mongoose'

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, description: String,
  type: { type: String, enum: ['film', 'trailer', 'script', 'story', 'bts'], required: true },
  category: String, genre: String, tags: [String], posterUrl: String, mediaUrl: String,
  pageCount: {
    type: Number,
    min: 1,
    max: 10000,
    validate: Number.isInteger,
    required() { return ['script', 'story'].includes(this.type) }
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 }, likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  moderationStatus: { type: String, enum: ['published', 'removed'], default: 'published', index: true },
  showcaseApproved: { type: Boolean, default: false, index: true },
  showcaseApprovedAt: { type: Date, default: null },
  showcaseApprovedBy: { type: String, default: null },
  moderatedAt: { type: Date, default: null },
  moderatedReason: { type: String, default: '' },
  moderatedBy: { type: String, default: null }
}, { timestamps: true })

contentSchema.index({ type: 1, category: 1, moderationStatus: 1, showcaseApproved: 1, createdAt: -1 })
contentSchema.index({ type: 1, moderationStatus: 1, createdAt: -1, views: -1 })
contentSchema.index({ moderationStatus: 1, type: 1, createdAt: -1, creator: 1 })

export default mongoose.model('Content', contentSchema)
