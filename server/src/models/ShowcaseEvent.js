import mongoose from 'mongoose'

const showcaseEventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  eventType: { type: String, enum: ['festival', 'competition', 'grant', 'industry-event'], default: 'festival', index: true },
  summary: { type: String, default: '', trim: true, maxlength: 320 },
  description: { type: String, default: '', trim: true, maxlength: 3000 },
  posterUrl: { type: String, default: '', trim: true, maxlength: 2048 },
  region: { type: String, default: '', trim: true, maxlength: 100 },
  startAt: { type: Date, default: null },
  endAt: { type: Date, default: null },
  submissionDeadline: { type: Date, default: null },
  applicationUrl: { type: String, required: true, trim: true, maxlength: 2048 },
  eventUrl: { type: String, default: '', trim: true, maxlength: 2048 },
  sourceKey: { type: String, default: null, trim: true, maxlength: 240 },
  sourceName: { type: String, default: '', trim: true, maxlength: 160 },
  sourceUrl: { type: String, default: '', trim: true, maxlength: 2048 },
  autoManaged: { type: Boolean, default: false },
  lastCheckedAt: { type: Date, default: null },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
  createdBy: { type: String, required: true, maxlength: 80 },
  updatedBy: { type: String, required: true, maxlength: 80 }
}, { timestamps: true })

showcaseEventSchema.index({ status: 1, submissionDeadline: 1, startAt: 1 })
showcaseEventSchema.index({ sourceKey: 1 }, { unique: true, sparse: true })

export default mongoose.model('ShowcaseEvent', showcaseEventSchema)
