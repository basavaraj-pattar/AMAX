import mongoose from 'mongoose'

const contentViewSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
  viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayKey: { type: String, required: true },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 35 * 24 * 60 * 60 * 1000) }
}, { timestamps: true })

contentViewSchema.index({ contentId: 1, viewerId: 1, dayKey: 1 }, { unique: true })
contentViewSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('ContentView', contentViewSchema)
