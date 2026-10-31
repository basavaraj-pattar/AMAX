import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contentType: { type: String, enum: ['content', 'comment', 'equipment', 'user'], required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  category: {
    type: String,
    enum: [
      'nudity_sexual',
      'vulgar_abusive',
      'harassment_bullying',
      'hate_speech_threats',
      'illegal_content',
      'copyright_infringement',
      'fraud_scam_impersonation',
      'spam',
      'other'
    ],
    required: true
  },
  explanation: { type: String, maxlength: 2000, default: '' },
  status: { type: String, enum: ['pending', 'under_review', 'resolved', 'dismissed'], default: 'pending' },
  reviewedBy: { type: String, default: null }, // admin username
  reviewedAt: { type: Date, default: null },
  resolutionNote: { type: String, maxlength: 1000, default: '' }
}, { timestamps: true })

reportSchema.index({ contentType: 1, contentId: 1, reporter: 1 })
reportSchema.index({ status: 1, createdAt: -1 })
reportSchema.index({ contentType: 1, contentId: 1 })

export default mongoose.model('Report', reportSchema)
